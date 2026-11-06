package com.pblm.parabellum;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.widget.RemoteViews;

public final class PblmWidget extends AppWidgetProvider {
    private static PendingIntent link(Context ctx, String path, int code) {
        Intent intent = new Intent(ctx, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(Uri.parse("https://k9dxx.github.io/parabellum-panel/" + path));
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(ctx, code, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.pblm_widget);
            views.setTextColor(R.id.pblm_widget_title, AppPersonalizer.accent(context));
            views.setOnClickPendingIntent(R.id.pblm_widget_home, link(context, "", 701));
            views.setOnClickPendingIntent(R.id.pblm_widget_community, link(context, "comunidade.html", 702));
            views.setOnClickPendingIntent(R.id.pblm_widget_news, link(context, "noticias.html", 703));
            manager.updateAppWidget(id, views);
        }
    }
}
