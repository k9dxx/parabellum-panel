package com.pblm.parabellum;

import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ShortcutInfo;
import android.content.pm.ShortcutManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.Icon;
import android.net.Uri;
import android.os.Build;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.Arrays;

public final class AppPersonalizer {
    private static final String PREFS = "pblm_native_personalization_v1";
    private static final String ICON = "pblm-user-brand.png";
    public static final int IMAGE_REQUEST = 778;
    private static final int DEFAULT_ACCENT = Color.rgb(226, 29, 50);
    private static final int[] COLORS = {
        0xffe21d32, 0xff8b5cf6, 0xff2962ff, 0xff16a34a, 0xffff9f1a, 0xffe65daa, 0xffeaeaea
    };

    private AppPersonalizer() { }

    static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static int accent(Context context) {
        return preferences(context).getInt("accent", DEFAULT_ACCENT);
    }

    static boolean animation(Context context) {
        return preferences(context).getBoolean("animation", true);
    }

    static boolean glow(Context context) {
        return preferences(context).getBoolean("glow", true);
    }

    static Bitmap loadBrand(Context context) {
        File file = new File(context.getFilesDir(), ICON);
        if (!file.isFile()) return null;
        return BitmapFactory.decodeFile(file.getAbsolutePath());
    }

    private static GradientDrawable panel(int color, int radius, int stroke) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(radius);
        if (stroke != 0) drawable.setStroke(1, stroke);
        return drawable;
    }

    private static int dp(Context context, int n) {
        return (int) (context.getResources().getDisplayMetrics().density * n + 0.5f);
    }

    private static TextView text(Context ctx, String value, int size, int color) {
        TextView label = new TextView(ctx);
        label.setText(value);
        label.setTextSize(size);
        label.setTextColor(color);
        label.setLineSpacing(0, 1.2f);
        return label;
    }

    private static Button button(Context ctx, String title) {
        Button b = new Button(ctx);
        b.setText(title);
        b.setAllCaps(false);
        b.setTextColor(Color.WHITE);
        b.setTextSize(13);
        b.setBackground(panel(0xff3b1724, dp(ctx, 12), 0xff702c44));
        return b;
    }

    private static void addGap(LinearLayout parent, Context ctx, int height) {
        View v = new View(ctx);
        parent.addView(v, new LinearLayout.LayoutParams(1, dp(ctx, height)));
    }

    static void show(MainActivity activity) {
        final int accent = accent(activity);
        ScrollView scroll = new ScrollView(activity);
        scroll.setFillViewport(false);
        scroll.setBackgroundColor(0xff0b090d);
        LinearLayout layout = new LinearLayout(activity);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(dp(activity, 20), dp(activity, 22), dp(activity, 20), dp(activity, 24));
        scroll.addView(layout);

        TextView title = text(activity, "⛧ PERSONALIZAÇÃO PBLM", 23, accent);
        title.setTypeface(null, 1);
        layout.addView(title);
        layout.addView(text(activity, "Visual exclusivo para este celular. O portal e os membros continuam intactos.", 12, 0xffc6adbb));
        addGap(layout, activity, 18);

        TextView section = text(activity, "COR DA INTERFACE", 12, 0xffffccd8);
        section.setTypeface(null, 1);
        layout.addView(section);
        addGap(layout, activity, 8);
        LinearLayout palette = new LinearLayout(activity);
        palette.setGravity(Gravity.CENTER_VERTICAL);
        palette.setOrientation(LinearLayout.HORIZONTAL);
        layout.addView(palette);
        for (int value : COLORS) {
            Button sample = button(activity, " ");
            GradientDrawable swatch = panel(value, dp(activity, 11), value == accent ? Color.WHITE : 0xff38232d);
            sample.setBackground(swatch);
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(0, dp(activity, 42), 1f);
            params.setMargins(dp(activity, 2), 0, dp(activity, 2), 0);
            palette.addView(sample, params);
            sample.setContentDescription("Escolher cor " + String.format("#%06X", value & 0xffffff));
            sample.setOnClickListener(v -> {
                preferences(activity).edit().putInt("accent", value).apply();
                title.setTextColor(value);
                activity.applyNativeTheme();
                Toast.makeText(activity, "Cor aplicada ao aplicativo.", Toast.LENGTH_SHORT).show();
            });
        }

        addGap(layout, activity, 12);
        LinearLayout custom = new LinearLayout(activity);
        custom.setGravity(Gravity.CENTER_VERTICAL);
        custom.setOrientation(LinearLayout.HORIZONTAL);
        EditText hex = new EditText(activity);
        hex.setSingleLine(true);
        hex.setTextColor(Color.WHITE);
        hex.setHintTextColor(0xff9e8792);
        hex.setHint("#E21D32");
        hex.setText(String.format("#%06X", accent & 0xffffff));
        hex.setInputType(android.text.InputType.TYPE_CLASS_TEXT);
        custom.addView(hex, new LinearLayout.LayoutParams(0, dp(activity, 50), 1f));
        Button apply = button(activity, "Aplicar");
        custom.addView(apply, new LinearLayout.LayoutParams(dp(activity, 96), dp(activity, 46)));
        apply.setOnClickListener(v -> {
            String value = hex.getText().toString().trim();
            if (!value.matches("#[a-fA-F0-9]{6}")) {
                hex.setError("Use #RRGGBB");
                return;
            }
            int color = Color.parseColor(value);
            preferences(activity).edit().putInt("accent", color).apply();
            title.setTextColor(color);
            activity.applyNativeTheme();
            Toast.makeText(activity, "Cor aplicada.", Toast.LENGTH_SHORT).show();
        });
        layout.addView(custom);

        addGap(layout, activity, 17);
        Switch entry = new Switch(activity);
        entry.setText("Entrada cinematográfica");
        entry.setTextSize(15);
        entry.setTextColor(Color.WHITE);
        entry.setChecked(animation(activity));
        layout.addView(entry);
        entry.setOnCheckedChangeListener((v, checked) ->
                preferences(activity).edit().putBoolean("animation", checked).apply());

        addGap(layout, activity, 6);
        Switch shine = new Switch(activity);
        shine.setText("Efeito de brilho no emblema");
        shine.setTextSize(15);
        shine.setTextColor(Color.WHITE);
        shine.setChecked(glow(activity));
        layout.addView(shine);
        shine.setOnCheckedChangeListener((v, checked) ->
                preferences(activity).edit().putBoolean("glow", checked).apply());
        layout.addView(text(activity, "Essas opções serão aplicadas na próxima abertura do aplicativo.", 11, 0xff9b8290));
        addGap(layout, activity, 20);

        TextView brand = text(activity, "SUA FOTO / SEU EMBLEMA", 12, 0xffffccd8);
        brand.setTypeface(null, 1);
        layout.addView(brand);
        addGap(layout, activity, 8);
        ImageView preview = new ImageView(activity);
        Bitmap current = loadBrand(activity);
        if (current != null) preview.setImageBitmap(current);
        else preview.setImageResource(R.drawable.pblm_icon);
        preview.setScaleType(ImageView.ScaleType.CENTER_CROP);
        preview.setBackground(panel(0xff150d13, dp(activity, 16), 0xff6d293f));
        layout.addView(preview, new LinearLayout.LayoutParams(dp(activity, 116), dp(activity, 116)));
        addGap(layout, activity, 10);

        Button choose = button(activity, "▧  ESCOLHER FOTO DA GALERIA");
        layout.addView(choose, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(activity, 48)));
        choose.setOnClickListener(v -> {
            Intent picker = new Intent(Intent.ACTION_GET_CONTENT);
            picker.setType("image/*");
            picker.addCategory(Intent.CATEGORY_OPENABLE);
            try { activity.startActivityForResult(Intent.createChooser(picker, "Escolher emblema PBLM"), IMAGE_REQUEST); }
            catch (Exception error) { Toast.makeText(activity, "Não foi possível abrir a galeria.", Toast.LENGTH_LONG).show(); }
        });
        addGap(layout, activity, 8);

        Button shortcut = button(activity, "⌂  CRIAR ÍCONE COM MINHA FOTO");
        layout.addView(shortcut, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(activity, 48)));
        shortcut.setOnClickListener(v -> pinShortcut(activity));
        layout.addView(text(activity,
                "A foto aparece na entrada do app e pode ser usada num NOVO atalho na tela inicial. O Android não permite trocar o ícone original do APK por uma foto arbitrária sem recriar/assinar o aplicativo.",
                11, 0xffc6adbb));
        addGap(layout, activity, 18);

        Button portal = button(activity, "⚙  PERSONALIZAR O PORTAL");
        layout.addView(portal, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(activity, 48)));
        final AlertDialog dialog = new AlertDialog.Builder(activity).setView(scroll)
                .setNegativeButton("FECHAR", (d, w) -> { }).create();
        portal.setOnClickListener(v -> {
            dialog.dismiss();
            activity.openWebPreferences();
        });
        dialog.show();
        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(panel(0xff0b090d, dp(activity, 18), 0xff552337));
            dialog.getWindow().setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        }
    }

    static void onImageSelected(MainActivity activity, Uri uri) {
        if (uri == null) return;
        try {
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inJustDecodeBounds = true;
            try (InputStream input = activity.getContentResolver().openInputStream(uri)) {
                if (input == null) throw new IllegalArgumentException("Imagem indisponível");
                BitmapFactory.decodeStream(input, null, options);
            }
            if (options.outWidth <= 0 || options.outHeight <= 0) throw new IllegalArgumentException("Formato inválido");
            int sample = 1;
            while (Math.max(options.outWidth / sample, options.outHeight / sample) > 1024) sample *= 2;
            options.inJustDecodeBounds = false;
            options.inSampleSize = sample;
            Bitmap original;
            try (InputStream input = activity.getContentResolver().openInputStream(uri)) {
                original = BitmapFactory.decodeStream(input, null, options);
            }
            if (original == null) throw new IllegalArgumentException("Não foi possível abrir a foto");
            Bitmap output = squareBitmap(original);
            try (FileOutputStream out = activity.openFileOutput(ICON, Context.MODE_PRIVATE)) {
                if (!output.compress(Bitmap.CompressFormat.PNG, 100, out)) throw new IllegalStateException("Erro ao salvar");
            }
            original.recycle();
            output.recycle();
            Toast.makeText(activity, "Emblema salvo! Reabra a personalização para conferir.", Toast.LENGTH_LONG).show();
        } catch (Exception error) {
            Toast.makeText(activity, "Imagem inválida ou muito grande. Escolha outra foto.", Toast.LENGTH_LONG).show();
        }
    }

    private static Bitmap squareBitmap(Bitmap src) {
        int size = 384;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
        canvas.drawColor(0xff0b090d);
        int crop = Math.min(src.getWidth(), src.getHeight());
        int left = (src.getWidth() - crop) / 2, top = (src.getHeight() - crop) / 2;
        canvas.drawBitmap(src,
                new android.graphics.Rect(left, top, left + crop, top + crop),
                new android.graphics.Rect(0, 0, size, size), paint);
        return bitmap;
    }

    private static void pinShortcut(MainActivity activity) {
        if (Build.VERSION.SDK_INT < 26) {
            Toast.makeText(activity, "Atalhos personalizados exigem Android 8 ou superior.", Toast.LENGTH_LONG).show();
            return;
        }
        ShortcutManager manager = activity.getSystemService(ShortcutManager.class);
        if (manager == null || !manager.isRequestPinShortcutSupported()) {
            Toast.makeText(activity, "O launcher deste celular não permite esse atalho.", Toast.LENGTH_LONG).show();
            return;
        }
        Bitmap icon = loadBrand(activity);
        if (icon == null) {
            Toast.makeText(activity, "Primeiro escolha uma foto da galeria.", Toast.LENGTH_LONG).show();
            return;
        }
        Intent launch = new Intent(activity, MainActivity.class);
        launch.setAction(Intent.ACTION_MAIN);
        launch.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        ShortcutInfo info = new ShortcutInfo.Builder(activity, "pblm-user-icon")
                .setShortLabel("PARABELLUM")
                .setLongLabel("PARABELLUM — minha foto")
                .setIcon(Icon.createWithBitmap(icon))
                .setIntent(launch)
                .build();
        try {
            if (manager.getPinnedShortcuts().stream().anyMatch(s -> "pblm-user-icon".equals(s.getId()))) {
                manager.updateShortcuts(Arrays.asList(info));
                Toast.makeText(activity, "Ícone do atalho atualizado na tela inicial.", Toast.LENGTH_LONG).show();
            } else if (!manager.requestPinShortcut(info, null)) {
                Toast.makeText(activity, "O launcher recusou a criação do atalho.", Toast.LENGTH_LONG).show();
            }
        } catch (Exception error) {
            Toast.makeText(activity, "Não foi possível criar o atalho neste launcher.", Toast.LENGTH_LONG).show();
        } finally {
            icon.recycle();
        }
    }
}
