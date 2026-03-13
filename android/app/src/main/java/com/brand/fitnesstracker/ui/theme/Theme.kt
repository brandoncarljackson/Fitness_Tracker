package com.brand.fitnesstracker.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = Green500,
    onPrimary = White,
    primaryContainer = Green700,
    secondary = Blue500,
    onSecondary = White,
    background = Surface,
    surface = White,
    onBackground = DarkGray,
    onSurface = DarkGray
)

private val DarkColors = darkColorScheme(
    primary = Green500,
    onPrimary = White,
    secondary = Blue500,
    onSecondary = White
)

@Composable
fun FitnessTrackerTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColors else LightColors
    MaterialTheme(
        colorScheme = colors,
        typography = Typography,
        content = content
    )
}
