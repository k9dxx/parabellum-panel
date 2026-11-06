package com.pblm.parabellum;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.drawable.Icon;
import android.view.HapticFeedbackConstants;
import java.util.Arrays;
import android.os.Bundle;
import android.os.Build;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.net.Uri;
import android.view.View;
import android.view.WindowInsets;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.net.http.SslError;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.DownloadListener;

public class MainActivity extends Activity {
    private static final String HOME = "https://k9dxx.github.io/parabellum-panel/";
    private static final int FILE_PICKER_REQUEST = 777;
    private WebView browser;
    private ProgressBar progress;
    private ValueCallback<Uri[]> fileCallback;
    private LinearLayout nativeBar;
    private TextView brandText;
    private Button settingsButton;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(8, 8, 8));
        getWindow().setNavigationBarColor(Color.rgb(8, 8, 8));
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(8, 8, 8));
        setContentView(root);
        if (Build.VERSION.SDK_INT >= 35) {
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        }

        LinearLayout shell = new LinearLayout(this);
        shell.setOrientation(LinearLayout.VERTICAL);
        root.addView(shell, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        nativeBar = new LinearLayout(this);
        nativeBar.setOrientation(LinearLayout.HORIZONTAL);
        nativeBar.setGravity(Gravity.CENTER_VERTICAL);
        nativeBar.setPadding(dp(14), 0, dp(8), 0);
        shell.addView(nativeBar, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(51)));

        brandText = new TextView(this);
        brandText.setText("⛧  PARABELLUM");
        brandText.setTextSize(16);
        brandText.setTypeface(null, 1);
        brandText.setLetterSpacing(.11f);
        nativeBar.addView(brandText, new LinearLayout.LayoutParams(0,
                ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        Button refresh = chromeButton("↻", "Atualizar portal");
        nativeBar.addView(refresh, new LinearLayout.LayoutParams(dp(44), dp(43)));
        refresh.setOnClickListener(v -> { if (browser != null) browser.reload(); });

        settingsButton = chromeButton("⚙", "Personalizar aplicativo");
        nativeBar.addView(settingsButton, new LinearLayout.LayoutParams(dp(44), dp(43)));
        settingsButton.setOnClickListener(v -> {
            if (AppPersonalizer.haptics(this)) v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
            AppPersonalizer.show(this);
        });
        applyNativeTheme();

        FrameLayout webpage = new FrameLayout(this);
        shell.addView(webpage, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        browser = new WebView(this);
        browser.setBackgroundColor(Color.rgb(8, 8, 8));
        browser.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webpage.addView(browser, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        FrameLayout.LayoutParams bar = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(3), Gravity.TOP);
        webpage.addView(progress, bar);

        WebSettings options = browser.getSettings();
        options.setJavaScriptEnabled(true); // Requerido pelas funcionalidades existentes do portal.
        options.setDomStorageEnabled(true);
        options.setAllowFileAccess(false);
        options.setAllowContentAccess(false);
        options.setJavaScriptCanOpenWindowsAutomatically(false);
        options.setSupportMultipleWindows(false);
        options.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        if (Build.VERSION.SDK_INT >= 26) options.setSafeBrowsingEnabled(true);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(browser, false);

        browser.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (isPortal(url)) return false;
                openExternal(url);
                return true;
            }
            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.cancel();
            }
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    final String html = "<!doctype html><html lang='pt-BR'><meta name='viewport' content='width=device-width,initial-scale=1'>"
                        + "<body style='background:#080808;color:#f4e8ed;font:16px system-ui;padding:30px'>"
                        + "<h1 style='color:#e21d32'>⛧ Sem conexão</h1>"
                        + "<p>Verifique sua internet para carregar o portal PARABELLUM.</p>"
                        + "<a style='color:#ff5269' href='" + HOME + "'>Tentar novamente ↗</a></body></html>";
                    view.loadDataWithBaseURL(HOME, html, "text/html", "UTF-8", null);
                }
            }
        });

        browser.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progress.setProgress(newProgress);
                progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            }
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_PICKER_REQUEST);
                    return true;
                } catch (Exception error) {
                    fileCallback = null;
                    callback.onReceiveValue(null);
                    return false;
                }
            }
        });

        browser.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            try {
                Uri parsed = Uri.parse(url);
                if ("https".equalsIgnoreCase(parsed.getScheme())) {
                    startActivity(new Intent(Intent.ACTION_VIEW, parsed));
                }
            } catch (Exception ignored) { }
        });

        if (state == null) browser.loadUrl(resolveTarget(getIntent()));
        else browser.restoreState(state);
        installShortcuts();
        handleSharedText(getIntent());
        new UpdateChecker(this).check();
        if (state == null) PblmIntro.show(this, root);
    }

    private String resolveTarget(Intent intent) {
        if (intent == null) return HOME;
        Uri uri = intent.getData();
        if (isPortal(uri)) return uri.toString();
        return HOME;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (browser != null && isPortal(intent.getData())) browser.loadUrl(intent.getDataString());
        handleSharedText(intent);
    }

    private void handleSharedText(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        if (!"text/plain".equals(intent.getType())) return;
        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (text == null || text.trim().isEmpty()) return;
        final String value = text.length() > 3000 ? text.substring(0, 3000) : text;
        new AlertDialog.Builder(this)
            .setTitle("⛧ Compartilhar com PARABELLUM")
            .setMessage("Deseja copiar o texto compartilhado e abrir a Área pessoal? Você decide se deseja publicá-lo.")
            .setPositiveButton("Copiar e abrir", (dialog, which) -> {
                ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                clipboard.setPrimaryClip(ClipData.newPlainText("Compartilhamento PBLM", value));
                if (browser != null) browser.loadUrl(HOME + "pessoal.html#community-editor");
            })
            .setNegativeButton("Cancelar", null)
            .show();
    }

    private void installShortcuts() {
        if (Build.VERSION.SDK_INT < 25) return;
        ShortcutManager manager = getSystemService(ShortcutManager.class);
        if (manager == null) return;
        try {
            String[] paths = {"comunidade.html", "preferencias.html", "noticias.html"};
            String[] names = {"Comunidade", "Personalizar", "Notícias"};
            ShortcutInfo[] shortcuts = new ShortcutInfo[paths.length];
            for (int i = 0; i < paths.length; i++) {
                Intent intent = new Intent(this, MainActivity.class);
                intent.setAction(Intent.ACTION_VIEW);
                intent.setData(Uri.parse(HOME + paths[i]));
                shortcuts[i] = new ShortcutInfo.Builder(this, "pblm-nav-" + i)
                    .setShortLabel(names[i])
                    .setLongLabel("PARABELLUM — " + names[i])
                    .setIcon(Icon.createWithResource(this, R.drawable.pblm_icon))
                    .setIntent(intent).build();
            }
            manager.setDynamicShortcuts(Arrays.asList(shortcuts));
        } catch (Exception ignored) { }
    }

    private int dp(int n) {
        return (int) (n * getResources().getDisplayMetrics().density + 0.5f);
    }

    private Button chromeButton(String title, String description) {
        Button button = new Button(this);
        button.setAllCaps(false);
        button.setText(title);
        button.setTextSize(23);
        button.setTextColor(Color.WHITE);
        button.setPadding(0, 0, 0, 0);
        button.setContentDescription(description);
        return button;
    }

    public void applyNativeTheme() {
        if (nativeBar == null) return;
        int accent = AppPersonalizer.accent(this);
        GradientDrawable background = new GradientDrawable(
                GradientDrawable.Orientation.LEFT_RIGHT,
                new int[]{0xff0b090d, 0xff22121a, 0xff0b090d});
        background.setStroke(dp(1), accent);
        nativeBar.setBackground(background);
        if (brandText != null) brandText.setTextColor(accent);
        if (settingsButton != null) settingsButton.setTextColor(accent);
        getWindow().setStatusBarColor(0xff080808);
        getWindow().setNavigationBarColor(0xff080808);
    }

    public void openWebPreferences() {
        if (browser != null) browser.loadUrl(HOME + "preferencias.html");
    }

    private boolean isPortal(Uri url) {
        return url != null
          && "https".equalsIgnoreCase(url.getScheme())
          && "k9dxx.github.io".equalsIgnoreCase(url.getHost())
          && (url.getPort() == -1 || url.getPort() == 443)
          && ("/parabellum-panel".equals(url.getPath()) || url.getPath().startsWith("/parabellum-panel/"));
    }

    private void openExternal(Uri url) {
        if (url == null) return;
        String scheme = url.getScheme();
        if (!"https".equalsIgnoreCase(scheme) && !"http".equalsIgnoreCase(scheme)) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW, url)); }
        catch (Exception ignored) { }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == AppPersonalizer.IMAGE_REQUEST) {
            if (resultCode == RESULT_OK && data != null) {
                AppPersonalizer.onImageSelected(this, data.getData());
            }
            return;
        }
        if (requestCode == FILE_PICKER_REQUEST && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            fileCallback = null;
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (browser != null) browser.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (browser != null && browser.canGoBack()) browser.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (fileCallback != null) { fileCallback.onReceiveValue(null); fileCallback = null; }
        if (browser != null) { browser.destroy(); browser = null; }
        super.onDestroy();
    }
}
