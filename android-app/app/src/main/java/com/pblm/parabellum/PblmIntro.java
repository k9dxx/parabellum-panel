package com.pblm.parabellum;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.DecelerateInterpolator;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

public final class PblmIntro {
    private PblmIntro() { }

    private static int dp(Activity activity, int n) {
        return (int) (n * activity.getResources().getDisplayMetrics().density + 0.5f);
    }

    public static void show(Activity activity, FrameLayout root) {
        if (!AppPersonalizer.animation(activity)) return;
        try {
            if (Settings.Global.getFloat(activity.getContentResolver(),
                    Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f) return;
        } catch (Exception ignored) { }

        final int color = AppPersonalizer.accent(activity);
        FrameLayout overlay = new FrameLayout(activity);
        overlay.setBackgroundColor(0xff08070a);
        overlay.setClickable(true);
        overlay.setFocusable(true);
        overlay.setContentDescription("Apresentação PARABELLUM");
        root.addView(overlay, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        View ambient = new View(activity);
        GradientDrawable light = new GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                new int[] {0xff0a080a, 0xff241019, 0xff0a080d});
        ambient.setBackground(light);
        overlay.addView(ambient, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        LinearLayout center = new LinearLayout(activity);
        center.setGravity(Gravity.CENTER);
        center.setOrientation(LinearLayout.VERTICAL);
        center.setPadding(dp(activity, 22), 0, dp(activity, 22), 0);
        FrameLayout.LayoutParams cp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER);
        overlay.addView(center, cp);

        ImageView emblem = new ImageView(activity);
        Bitmap chosen = AppPersonalizer.loadBrand(activity);
        if (chosen != null) emblem.setImageBitmap(chosen);
        else emblem.setImageResource(R.drawable.pblm_icon);
        emblem.setScaleType(ImageView.ScaleType.CENTER_CROP);
        GradientDrawable frame = new GradientDrawable();
        frame.setColor(0xff130d13);
        frame.setCornerRadius(dp(activity, 24));
        frame.setStroke(dp(activity, 2), color);
        emblem.setBackground(frame);
        emblem.setClipToOutline(true);
        center.addView(emblem, new LinearLayout.LayoutParams(dp(activity, 128), dp(activity, 128)));

        View line = new View(activity);
        line.setBackgroundColor(color);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dp(activity, 100), dp(activity, 2));
        lp.topMargin = dp(activity, 22);
        center.addView(line, lp);

        TextView title = new TextView(activity);
        title.setText("PARABELLUM");
        title.setTextColor(Color.WHITE);
        title.setTextSize(29);
        title.setGravity(Gravity.CENTER);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        title.setLetterSpacing(.13f);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        tp.topMargin = dp(activity, 16);
        center.addView(title, tp);

        TextView subtitle = new TextView(activity);
        subtitle.setText("⛧  PBLM.777  /  LEGACY");
        subtitle.setTextColor(color);
        subtitle.setTextSize(12);
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setLetterSpacing(.24f);
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        sp.topMargin = dp(activity, 6);
        center.addView(subtitle, sp);

        TextView footer = new TextView(activity);
        footer.setText("DISCIPLINA  ·  LEALDADE  ·  RESPEITO");
        footer.setTextColor(0xffa995a0);
        footer.setTextSize(9);
        footer.setGravity(Gravity.CENTER);
        footer.setLetterSpacing(.15f);
        FrameLayout.LayoutParams fp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM);
        fp.bottomMargin = dp(activity, 58);
        overlay.addView(footer, fp);

        emblem.setAlpha(0f);
        emblem.setScaleX(.68f);
        emblem.setScaleY(.68f);
        title.setAlpha(0f);
        title.setTranslationY(dp(activity, 18));
        subtitle.setAlpha(0f);
        line.setScaleX(0f);
        line.setPivotX(dp(activity, 50));
        footer.setAlpha(0f);
        if (AppPersonalizer.glow(activity)) {
            emblem.setElevation(dp(activity, 14));
        }
        AnimatorSet intro = new AnimatorSet();
        intro.playTogether(
                ObjectAnimator.ofFloat(emblem, View.ALPHA, 0f, 1f),
                ObjectAnimator.ofFloat(emblem, View.SCALE_X, .68f, 1f),
                ObjectAnimator.ofFloat(emblem, View.SCALE_Y, .68f, 1f),
                ObjectAnimator.ofFloat(title, View.ALPHA, 0f, 1f),
                ObjectAnimator.ofFloat(title, View.TRANSLATION_Y, dp(activity, 18), 0f),
                ObjectAnimator.ofFloat(subtitle, View.ALPHA, 0f, 1f),
                ObjectAnimator.ofFloat(line, View.SCALE_X, 0f, 1f),
                ObjectAnimator.ofFloat(footer, View.ALPHA, 0f, 1f)
        );
        intro.setDuration(650);
        intro.setInterpolator(new DecelerateInterpolator());
        intro.start();

        Handler handler = new Handler(Looper.getMainLooper());
        handler.postDelayed(() -> {
            if (overlay.getParent() == null || activity.isFinishing() || activity.isDestroyed()) {
                root.removeView(overlay);
                return;
            }
            overlay.animate().alpha(0f).setDuration(310)
                    .withEndAction(() -> root.removeView(overlay)).start();
        }, 1100);
    }
}
