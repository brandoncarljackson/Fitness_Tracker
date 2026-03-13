package com.brand.fitnesstracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
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
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.brand.fitnesstracker.ui.theme.Blue500
import com.brand.fitnesstracker.ui.theme.DarkGray
import com.brand.fitnesstracker.ui.theme.LightGray
import com.brand.fitnesstracker.ui.theme.MedGray
import com.brand.fitnesstracker.viewmodel.WorkoutViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HistoryScreen(viewModel: WorkoutViewModel, innerPadding: PaddingValues) {
    val history by viewModel.workoutHistory.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8F9FA))
            .padding(innerPadding)
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White)
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Filled.History, contentDescription = null, tint = DarkGray, modifier = Modifier.size(28.dp))
            Spacer(Modifier.width(10.dp))
            Text("Workout History", fontSize = 24.sp, fontWeight = FontWeight.Black, color = DarkGray)
        }

        if (history.isEmpty()) {
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Icon(Icons.Filled.CalendarToday, contentDescription = null, tint = LightGray, modifier = Modifier.size(64.dp))
                Spacer(Modifier.height(16.dp))
                Text("No workouts recorded yet.", color = LightGray, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
            }
        } else {
            LazyColumn(contentPadding = PaddingValues(15.dp)) {
                items(history) { session ->
                    HistoryCard(session = session)
                }
            }
        }
    }
}

@Composable
private fun HistoryCard(session: com.brand.fitnesstracker.data.model.WorkoutSession) {
    val dateFormatter = SimpleDateFormat("MMM d, yyyy", Locale.US)
    val formattedDate = dateFormatter.format(Date(session.startTime))
    val mins = session.duration / 60
    val secs = session.duration % 60

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 15.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(2.dp),
        shape = RoundedCornerShape(15.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(formattedDate, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = DarkGray)
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Blue500)
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.Timer, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("${mins}m ${secs}s", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.ExtraBold)
                }
            }

            Spacer(Modifier.height(8.dp))
            Text("${session.exercises.size} Exercises Completed", color = MedGray, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)

            if (session.exercises.isNotEmpty()) {
                Spacer(Modifier.height(10.dp))
                session.exercises.take(3).forEach { ex ->
                    Text("• ${ex.name}", color = LightGray, fontSize = 14.sp, modifier = Modifier.padding(bottom = 2.dp))
                    ex.sets.forEachIndexed { idx, set ->
                        Text(
                            "  Set ${idx + 1}: ${set.reps} reps${if (set.weight > 0) " @ ${set.weight} kg" else ""}",
                            color = Color(0xFFB2BEC3),
                            fontSize = 12.sp,
                            modifier = Modifier.padding(start = 14.dp, bottom = 1.dp)
                        )
                    }
                }
                if (session.exercises.size > 3) {
                    Text("+${session.exercises.size - 3} more", color = LightGray, fontSize = 12.sp, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
                }
            }
        }
    }
}
