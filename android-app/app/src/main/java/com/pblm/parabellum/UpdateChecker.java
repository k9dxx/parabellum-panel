package com.pblm.parabellum;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public final class UpdateChecker {
    private static final String LATEST_API =
            "https://api.github.com/repos/k9dxx/parabellum-panel/releases/latest";
    private static final long CHECK_INTERVAL_MS = 12L * 60L * 60L * 1000L;
    private final Activity activity;

    public UpdateChecker(Activity activity) {
        this.activity = activity;
    }

    public void check() {
        final SharedPreferences prefs =
                activity.getSharedPreferences("pblm_android_updates", Activity.MODE_PRIVATE);
        final long now = System.currentTimeMillis();
        final long lastCheck = prefs.getLong("last_successful_check", 0L);
        if (lastCheck > 0 && now >= lastCheck && now - lastCheck < CHECK_INTERVAL_MS) return;

        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                URL endpoint = new URL(LATEST_API);
                connection = (HttpURLConnection) endpoint.openConnection();
                connection.setConnectTimeout(6500);
                connection.setReadTimeout(7000);
                connection.setRequestProperty("Accept", "application/vnd.github+json");
                connection.setRequestProperty("User-Agent", "PARABELLUM-Android-App");
                if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) return;

                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                try (InputStream stream = connection.getInputStream()) {
                    byte[] block = new byte[4096];
                    int bytes;
                    while ((bytes = stream.read(block)) != -1) {
                        if (buffer.size() + bytes > 65536) return;
                        buffer.write(block, 0, bytes);
                    }
                }
                JSONObject release = new JSONObject(buffer.toString("UTF-8"));
                if (release.optBoolean("draft", false) || release.optBoolean("prerelease", false)) return;
                String tag = release.optString("tag_name", "");
                String releaseUrl = release.optString("html_url", "");
                if (!tag.matches("v?[0-9]+\\.[0-9]+\\.[0-9]+")) return;
                Uri uri = Uri.parse(releaseUrl);
                if (!"https".equalsIgnoreCase(uri.getScheme())
                        || !"github.com".equalsIgnoreCase(uri.getHost())
                        || !uri.getPath().startsWith("/k9dxx/parabellum-panel/releases/tag/")) return;

                prefs.edit().putLong("last_successful_check", System.currentTimeMillis()).apply();
                String current = activity.getPackageManager()
                        .getPackageInfo(activity.getPackageName(), 0).versionName;
                if (!isNewer(tag, current)) return;
                activity.runOnUiThread(() -> {
                    if (activity.isFinishing() || activity.isDestroyed()) return;
                    new AlertDialog.Builder(activity)
                            .setTitle("⛧ Nova versão PARABELLUM")
                            .setMessage("Versão " + tag.replaceFirst("^v", "")
                                    + " disponível.\nInstalada: " + current
                                    + "\n\nAbra o lançamento oficial para baixar e instalar a atualização.")
                            .setPositiveButton("Ver atualização", (dialog, which) -> {
                                try {
                                    activity.startActivity(new Intent(Intent.ACTION_VIEW, uri));
                                } catch (Exception ignored) { }
                            })
                            .setNegativeButton("Depois", null)
                            .show();
                });
            } catch (Exception ignored) {
                // Falhas de conexão, rate limit ou ausência de release não interrompem o app.
            } finally {
                if (connection != null) connection.disconnect();
            }
        }, "PBLM-release-check").start();
    }

    private static boolean isNewer(String remote, String installed) {
        try {
            String[] a = remote.replaceFirst("^v", "").split("\\.");
            String[] b = installed.replaceFirst("^v", "").split("\\.");
            if (a.length != 3 || b.length != 3) return false;
            for (int i = 0; i < 3; i++) {
                int x = Integer.parseInt(a[i]);
                int y = Integer.parseInt(b[i]);
                if (x != y) return x > y;
            }
        } catch (RuntimeException ignored) { }
        return false;
    }
}
