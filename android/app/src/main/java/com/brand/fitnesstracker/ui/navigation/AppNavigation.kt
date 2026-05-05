package com.brand.fitnesstracker.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.brand.fitnesstracker.ui.screens.HistoryScreen
import com.brand.fitnesstracker.ui.screens.ProfileScreen
import com.brand.fitnesstracker.ui.screens.SearchScreen
import com.brand.fitnesstracker.ui.screens.WorkoutScreen
import com.brand.fitnesstracker.ui.theme.Green500
import com.brand.fitnesstracker.ui.theme.LightGray
import com.brand.fitnesstracker.viewmodel.WorkoutViewModel

sealed class Screen(val route: String, val label: String, val icon: ImageVector) {
    object Workout : Screen("workout", "Workout", Icons.Filled.FitnessCenter)
    object Search : Screen("search", "Search", Icons.Filled.Search)
    object History : Screen("history", "History", Icons.Filled.History)
    object Profile : Screen("profile", "Profile", Icons.Filled.Person)
}

private val bottomNavItems = listOf(
    Screen.Workout,
    Screen.Search,
    Screen.History,
    Screen.Profile
)

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val viewModel: WorkoutViewModel = viewModel()

    Scaffold(
        bottomBar = {
            val navBackStackEntry by navController.currentBackStackEntryAsState()
            val currentDestination = navBackStackEntry?.destination
            NavigationBar(containerColor = androidx.compose.ui.graphics.Color.White) {
                bottomNavItems.forEach { screen ->
                    NavigationBarItem(
                        icon = { Icon(screen.icon, contentDescription = screen.label) },
                        label = { Text(screen.label) },
                        selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Green500,
                            selectedTextColor = Green500,
                            unselectedIconColor = LightGray,
                            unselectedTextColor = LightGray,
                            indicatorColor = androidx.compose.ui.graphics.Color.White
                        ),
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(navController = navController, startDestination = Screen.Workout.route) {
            composable(Screen.Workout.route) { WorkoutScreen(viewModel = viewModel, innerPadding = innerPadding) }
            composable(Screen.Search.route) { SearchScreen(viewModel = viewModel, innerPadding = innerPadding) }
            composable(Screen.History.route) { HistoryScreen(viewModel = viewModel, innerPadding = innerPadding) }
            composable(Screen.Profile.route) { ProfileScreen(viewModel = viewModel, innerPadding = innerPadding) }
        }
    }
}
