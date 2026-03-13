package com.brand.fitnesstracker.ui.screens

import android.view.ViewGroup
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.brand.fitnesstracker.data.model.Exercise
import com.brand.fitnesstracker.ui.theme.Blue500
import com.brand.fitnesstracker.ui.theme.DarkGray
import com.brand.fitnesstracker.ui.theme.Green500
import com.brand.fitnesstracker.ui.theme.LightGray
import com.brand.fitnesstracker.ui.theme.MedGray
import com.brand.fitnesstracker.viewmodel.WorkoutViewModel

@Composable
fun SearchScreen(viewModel: WorkoutViewModel, innerPadding: PaddingValues) {
    val exercises by viewModel.exercises.collectAsState()
    val isLoading by viewModel.isLoadingMore.collectAsState()
    val syncProgress by viewModel.syncProgress.collectAsState()

    var query by remember { mutableStateOf("") }
    var selected by remember { mutableStateOf<Exercise?>(null) }

    if (selected != null) {
        ExerciseDetailScreen(
            exercise = selected!!,
            onBack = { selected = null }
        )
        return
    }

    val filtered = exercises.filter { ex ->
        if (query.isBlank()) true
        else ex.name.contains(query, ignoreCase = true)
            || ex.category.contains(query, ignoreCase = true)
            || ex.equipment.contains(query, ignoreCase = true)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8F9FA))
            .padding(innerPadding)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth().background(Color.White).padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Filled.Search, contentDescription = null, tint = DarkGray, modifier = Modifier.size(28.dp))
            Spacer(Modifier.width(10.dp))
            Text("Exercise Search", fontSize = 22.sp, fontWeight = FontWeight.Black, color = DarkGray, modifier = Modifier.weight(1f))
            IconButton(onClick = { viewModel.performDeepSync() }, enabled = !isLoading) {
                Icon(Icons.Filled.Refresh, contentDescription = "Sync", tint = Green500)
            }
        }

        // Search bar
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            modifier = Modifier.fillMaxWidth().padding(horizontal = 15.dp, vertical = 10.dp),
            placeholder = { Text("Search exercises...") },
            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
            trailingIcon = {
                if (query.isNotEmpty()) {
                    IconButton(onClick = { query = "" }) {
                        Icon(Icons.Filled.Close, contentDescription = "Clear")
                    }
                }
            },
            singleLine = true,
            shape = RoundedCornerShape(12.dp)
        )

        // Sync progress / loading indicator
        if (isLoading) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 15.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Green500, strokeWidth = 2.dp)
                Spacer(Modifier.width(8.dp))
                Text(
                    if (syncProgress > 0) "Syncing exercises... $syncProgress%" else "Loading...",
                    color = MedGray,
                    fontSize = 13.sp
                )
            }
            Spacer(Modifier.height(6.dp))
        }

        // Internet search button
        if (query.isNotBlank() && filtered.isEmpty() && !isLoading) {
            Button(
                onClick = { viewModel.searchFromInternet(query) },
                modifier = Modifier.padding(horizontal = 15.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Blue500),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(Icons.Filled.Search, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Search Internet for \"$query\"", fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(8.dp))
        }

        // Exercise list
        LazyColumn(contentPadding = PaddingValues(horizontal = 15.dp, vertical = 8.dp)) {
            if (filtered.isEmpty() && !isLoading) {
                item {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth().padding(top = 32.dp)
                    ) {
                        Icon(Icons.Filled.FitnessCenter, contentDescription = null, tint = LightGray, modifier = Modifier.size(48.dp))
                        Spacer(Modifier.height(8.dp))
                        Text("No exercises found.", color = LightGray, fontSize = 16.sp)
                    }
                }
            } else {
                items(filtered) { exercise ->
                    SearchExerciseItem(exercise = exercise, onClick = { selected = exercise })
                }
            }
        }
    }
}

@Composable
private fun SearchExerciseItem(exercise: Exercise, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(2.dp),
        shape = RoundedCornerShape(12.dp),
        onClick = onClick
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Green500),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.FitnessCenter, contentDescription = null, tint = Color.White)
            }
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(exercise.name, fontWeight = FontWeight.ExtraBold, color = DarkGray, maxLines = 1, fontSize = 16.sp)
                Text(exercise.category, color = Green500, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                Text(exercise.equipment, color = LightGray, fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun ExerciseDetailScreen(exercise: Exercise, onBack: () -> Unit) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8F9FA))
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth().background(Color.White).padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = DarkGray)
            }
            Text(
                exercise.name,
                fontSize = 18.sp,
                fontWeight = FontWeight.ExtraBold,
                color = DarkGray,
                maxLines = 1,
                modifier = Modifier.weight(1f).padding(start = 8.dp)
            )
        }

        LazyColumn(contentPadding = PaddingValues(16.dp)) {
            // Video player
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.Black),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    AndroidView(
                        modifier = Modifier
                            .fillMaxWidth()
                            .aspectRatio(16f / 9f)
                            .clip(RoundedCornerShape(12.dp)),
                        factory = { ctx ->
                            val player = ExoPlayer.Builder(ctx).build().apply {
                                setMediaItem(MediaItem.fromUri(exercise.videoUrl))
                                prepare()
                                playWhenReady = false
                            }
                            PlayerView(ctx).apply {
                                this.player = player
                                layoutParams = ViewGroup.LayoutParams(
                                    ViewGroup.LayoutParams.MATCH_PARENT,
                                    ViewGroup.LayoutParams.MATCH_PARENT
                                )
                            }
                        },
                        onRelease = { playerView ->
                            playerView.player?.release()
                        }
                    )
                }
            }

            // Metadata chips
            item {
                Row(
                    modifier = Modifier.padding(bottom = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Chip(label = exercise.category, color = Green500)
                    Chip(label = exercise.equipment, color = Blue500)
                }
            }

            // Instructions
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("INSTRUCTIONS", fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, color = MedGray, letterSpacing = 1.sp)
                        Spacer(Modifier.height(8.dp))
                        Text(exercise.instructions, color = DarkGray, fontSize = 14.sp, lineHeight = 22.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun Chip(label: String, color: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(color.copy(alpha = 0.12f))
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Text(label, color = color, fontWeight = FontWeight.Bold, fontSize = 13.sp)
    }
}
