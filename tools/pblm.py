#!/usr/bin/env python3
"""PARABELLUM CLI: utilitários locais e consultas públicas, sem dependências."""
import argparse
import json
import re
import secrets
import string
import sys
import unicodedata
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

SITE = 'https://k9dxx.github.io/parabellum-panel/'
MAX_BYTES = 2 * 1024 * 1024
SCHEMAS = {
    'membros': ('nome', 'cargo', 'descricao'),
    'cargos': ('id', 'nome', 'descricao'),
    'noticias': ('id', 'titulo', 'categoria', 'data', 'resumo'),
    'galeria': ('id', 'titulo', 'categoria', 'arquivo'),
    'eventos': ('id', 'titulo', 'descricao', 'inicio', 'fim', 'local'),
    'recursos': ('id', 'titulo', 'categoria', 'descricao', 'arquivo', 'formato'),
    'faq': ('id', 'pergunta', 'resposta'),
}

def normalize(value):
    return ''.join(c for c in unicodedata.normalize('NFD', str(value)) if not unicodedata.combining(c)).casefold()

def fetch(path):
    url = urljoin(SITE, path)
    if not url.startswith(SITE):
        raise ValueError('O endereço precisa fazer parte do portal oficial.')
    request = Request(url, headers={'User-Agent': 'PARABELLUM-CLI/1.0'})
    with urlopen(request, timeout=20) as response:
        # Never forward credentials; all requests made by this CLI are public.
        if not response.url.startswith(SITE):
            raise ValueError('O servidor redirecionou para fora do portal oficial.')
        body = response.read(MAX_BYTES + 1)
    if len(body) > MAX_BYTES:
        raise ValueError('Arquivo maior que o limite de 2 MB.')
    return body

def validate(data):
    if not isinstance(data, dict):
        raise ValueError('O JSON precisa conter um objeto.')
    for kind, fields in SCHEMAS.items():
        items = data.get(kind)
        if not isinstance(items, list):
            raise ValueError(f'A lista {kind} está ausente.')
        ids = set()
        for item in items:
            if not isinstance(item, dict) or any(not isinstance(item.get(k), str) or not item[k].strip() for k in fields):
                raise ValueError(f'Registro incompleto em {kind}.')
            identifier = item.get('id', normalize(item.get('nome', '')).replace(' ', '-'))
            if not re.fullmatch(r'[a-z0-9][a-z0-9_-]*', identifier) or identifier in ids:
                raise ValueError(f'Identificador inválido ou repetido em {kind}.')
            ids.add(identifier)
            if kind == 'noticias' and (not isinstance(item.get('paragrafos'), list) or not item['paragrafos'] or any(not isinstance(p, str) or not p.strip() for p in item['paragrafos'])):
                raise ValueError('A notícia precisa de parágrafos de texto.')
    roles = {r['id'] for r in data['cargos']}
    if any(m['cargo'] not in roles for m in data['membros']):
        raise ValueError('Há um integrante com cargo inexistente.')
    return data

def content():
    return validate(json.loads(fetch('data/conteudo.json')))

def write_file(path, body, force=False):
    path = Path(path).expanduser()
    path.parent.mkdir(parents=True, exist_ok=True)
    mode = 'wb' if force else 'xb'
    try:
        with path.open(mode) as stream:
            stream.write(body)
    except FileExistsError as exc:
        raise ValueError(f'{path} já existe. Use outro nome ou --sobrescrever.') from exc
    return path

def parser():
    result = argparse.ArgumentParser(description='⛧ PARABELLUM: comandos locais e consultas públicas.')
    commands = result.add_subparsers(dest='command', required=True)
    commands.add_parser('status', help='Mostrar contagens do portal público.')
    for name in ('membros', 'noticias', 'agenda', 'materiais'):
        sub = commands.add_parser(name, help='Consultar conteúdo público.')
        sub.add_argument('--buscar', default='', help='Filtrar o texto, ignorando acentos.')
    sub = commands.add_parser('baixar', help='Baixar um material público pelo identificador.')
    sub.add_argument('id'); sub.add_argument('--pasta', default='.')
    sub.add_argument('--sobrescrever', action='store_true')
    sub = commands.add_parser('backup-publico', help='Baixar apenas o conteúdo público em JSON.')
    sub.add_argument('--arquivo', default='parabellum-conteudo-publico.json')
    sub.add_argument('--sobrescrever', action='store_true')
    sub = commands.add_parser('validar', help='Verificar a estrutura de um arquivo de conteúdo.')
    sub.add_argument('arquivo')
    sub = commands.add_parser('senha', help='Gerar uma senha local com aleatoriedade segura.')
    sub.add_argument('--tamanho', type=int, default=20, choices=range(12,65), metavar='12-64')
    commands.add_parser('pessoal', help='Mostrar o endereço da área pessoal; não lê dados privados.')
    return result

def run(args):
    if args.command == 'senha':
        chars = string.ascii_letters + string.digits + '!@#$%_-'
        print(''.join(secrets.choice(chars) for _ in range(args.tamanho)))
        return
    if args.command == 'validar':
        path = Path(args.arquivo).expanduser()
        if path.stat().st_size > MAX_BYTES:
            raise ValueError('Use um JSON de até 2 MB.')
        data = validate(json.loads(path.read_text(encoding='utf-8')))
        print('Estrutura válida. Referências de cargos e identificadores conferidos.')
        print('A validação não publica o arquivo nem verifica a privacidade de textos.')
        print(' | '.join(f'{len(items)} {name}' for name, items in data.items() if isinstance(items, list)))
        return
    if args.command == 'pessoal':
        print(SITE + 'pessoal.html')
        print('Os dados pessoais só podem ser consultados após login na área pessoal ativada.')
        return
    data = content()
    if args.command == 'status':
        print('⛧ PARABELLUM / CONTEÚDO PÚBLICO')
        print(SITE)
        for name in ('membros', 'cargos', 'noticias', 'eventos', 'recursos'):
            print(f'{name}: {len(data[name])}')
    elif args.command == 'backup-publico':
        path = write_file(args.arquivo, (json.dumps(data, ensure_ascii=False, indent=2)+'\n').encode(), args.sobrescrever)
        print(f'Conteúdo público salvo: {path}')
        print('Este backup não inclui contas, dados pessoais ou anotações privadas.')
    elif args.command == 'baixar':
        item = next((r for r in data['recursos'] if r['id'] == args.id), None)
        if item is None:
            raise ValueError('Material não encontrado. Use: python pblm.py materiais')
        path = item['arquivo']
        if not re.fullmatch(r'assets/downloads/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(zip|txt|css|pdf|svg|png|jpg|webp)', path):
            raise ValueError('Caminho do material inválido.')
        output = write_file(Path(args.pasta).expanduser()/Path(path).name, fetch(path), args.sobrescrever)
        print(f'Material salvo: {output}')
    else:
        kind = {'agenda': 'eventos', 'materiais': 'recursos'}.get(args.command, args.command)
        query = normalize(args.buscar)
        items = [item for item in data[kind] if query in normalize(json.dumps(item, ensure_ascii=False))]
        if not items:
            print('Nenhum resultado publicado para esse filtro.')
        for item in items:
            print('\n'+(item.get('titulo') or item.get('nome')))
            for field in ('id','cargo','data','inicio','fim','local','resumo','descricao','formato'):
                if item.get(field): print(f'  {field}: {item[field]}')

def main():
    args = parser().parse_args()
    try:
        run(args)
    except (OSError, ValueError, KeyError, TypeError, HTTPError, URLError) as exc:
        print(f'Não foi possível concluir: {exc}', file=sys.stderr)
        return 1
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
