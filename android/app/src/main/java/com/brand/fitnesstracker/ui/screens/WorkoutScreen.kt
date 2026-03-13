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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.brand.fitnesstracker.data.model.Exercise
import com.brand.fitnesstracker.data.model.WorkoutSet
import com.brand.fitnesstracker.ui.theme.Blue500
import com.brand.fitnesstracker.ui.theme.DarkGray
import com.brand.fitnesstracker.ui.theme.Green500
import com.brand.fitnesstracker.ui.theme.LightGray
import com.brand.fitnesstracker.ui.theme.MedGray
import com.brand.fitnesstracker.ui.theme.Red
import com.brand.fitnesstracker.viewmodel.WorkoutViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private fun formatHMS(seconds: Int): String {
    val hrs = seconds / 3600
    val mins = (seconds % 3600) / 60
    val secs = seconds % 60
    return if (hrs > 0) {
        "%d:%02d:%02d".format(hrs, mins, secs)
    } else {
        "%02d:%02d".format(mins, secs)
    }
}

private fun formatMS(secs: Int): String {
    val m = secs / 60
    val s = secs % 60
    return "%d:%02d".format(m, s)
}

enum class WorkoutSubView { None, AddExercise, LogExercise }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkoutScreen(viewModel: WorkoutViewModel, innerPadding: PaddingValues) {
    val activeWorkout by viewModel.activeWorkout.collectAsState()
    val timer by viewModel.timer.collectAsState()
    val exercises by viewModel.exercises.collectAsState()
    val restTimerDuration by viewModel.restTimerDuration.collectAsState()

    var subView by remember { mutableStateOf(WorkoutSubView.None) }
    var selectedExercise by remember { mutableStateOf<Exercise?>(null) }
    var searchQuery by remember { mutableStateOf("") }
    val currentSets = remember { mutableStateListOf<WorkoutSet>() }
    var currentWeight by remember { mutableStateOf("") }
    var currentReps by remember { mutableStateOf("") }

    // Rest timer
    var restTimeLeft by remember { mutableIntStateOf(0) }
    var restTimerActive by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    // Countdown coroutine
    LaunchedEffect(restTimerActive) {
        if (restTimerActive) {
            while (restTimeLeft > 0) {
                delay(1_000)
                restTimeLeft--
                if (restTimeLeft == 0) restTimerActive = false
            }
        }
    }

    fun stopRestTimer() {
        restTimerActive = false
        restTimeLeft = 0
    }

    fun startRestTimer() {
        stopRestTimer()
        restTimeLeft = restTimerDuration
        restTimerActive = true
    }

    // Reset state when workout ends
    LaunchedEffect(activeWorkout) {
        if (activeWorkout == null) {
            subView = WorkoutSubView.None
            selectedExercise = null
            currentSets.clear()
            currentWeight = ""
            currentReps = ""
            stopRestTimer()
        }
    }

    val filteredExercises = exercises.filter { ex ->
        if (searchQuery.isBlank()) true
        else ex.name.contains(searchQuery, ignoreCase = true)
            || ex.category.contains(searchQuery, ignoreCase = true)
            || ex.equipment.contains(searchQuery, ignoreCase = true)
    }

    // Dialog state
    var showFinishDialog by remember { mutableStateOf(false) }
    var showDiscardDialog by remember { mutableStateOf(false) }

    if (showFinishDialog) {
        AlertDialog(
            onDismissRequest = { showFinishDialog = false },
            title = { Text("Finish Workout") },
            text = { Text("Save and finish this workout?") },
            confirmButton = {
                Button(
                    onClick = { showFinishDialog = false; viewModel.endWorkout() },
                    colors = ButtonDefaults.buttonColors(containerColor = Green500)
                ) { Text("Finish") }
            },
            dismissButton = {
                TextButton(onClick = { showFinishDialog = false }) { Text("Cancel") }
            }
        )
    }

    if (showDiscardDialog) {
        AlertDialog(
            onDismissRequest = { showDiscardDialog = false },
            title = { Text("Discard Exercise?") },
            text = { Text("Sets logged for this exercise will not be saved.") },
            confirmButton = {
                Button(
                    onClick = {
                        showDiscardDialog = false
                        currentSets.clear()
                        selectedExercise = null
                        stopRestTimer()
                        subView = WorkoutSubView.None
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Red)
                ) { Text("Discard") }
            },
            dismissButton = {
                TextButton(onClick = { showDiscardDialog = false }) { Text("Stay") }
            }
        )
    }

    when {
        // ── No active workout ────────────────────────────────────────────────
        activeWorkout == null -> {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(Color(0xFFF8F9FA)),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Icon(
                    Icons.Filled.Timer,
                    contentDescription = null,
                    tint = MedGray,
                    modifier = Modifier.size(64.dp)
                )
                Spacer(Modifier.height(16.dp))
                Text(
                    text = formatHMS(timer),
                    fontSize = 40.sp,
                    fontWeight = FontWeight.Black,
                    color = DarkGray
                )
                Text("ACTIVE WORKOUT TIMER", fontSize = 12.sp, color = LightGray, fontWeight = FontWeight.ExtraBold)
                Spacer(Modifier.height(32.dp))
                Button(
                    onClick = { viewModel.startWorkout() },
                    colors = ButtonDefaults.buttonColors(containerColor = Green500),
                    shape = RoundedCornerShape(16.dp),
                    contentPadding = PaddingValues(horizontal = 40.dp, vertical = 18.dp)
                ) {
                    Icon(Icons.Filled.PlayArrow, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("START NEW WORKOUT", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                }
            }
        }

        // ── Add Exercise subview ─────────────────────────────────────────────
        subView == WorkoutSubView.AddExercise -> {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(Color(0xFFF8F9FA))
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { searchQuery = ""; subView = WorkoutSubView.None }) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = DarkGray)
                    }
                    Text(
                        "Add Exercise",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = DarkGray,
                        modifier = Modifier.weight(1f).padding(start = 8.dp)
                    )
                }
                // Search bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                    placeholder = { Text("Search exercises...") },
                    leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Filled.Close, contentDescription = "Clear")
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )
                Spacer(Modifier.height(8.dp))
                LazyColumn(contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)) {
                    if (filteredExercises.isEmpty()) {
                        item {
                            Text(
                                "No exercises found.",
                                color = LightGray,
                                modifier = Modifier.padding(24.dp)
                            )
                        }
                    } else {
                        items(filteredExercises) { exercise ->
                            ExercisePickItem(
                                exercise = exercise,
                                onClick = {
                                    selectedExercise = exercise
                                    currentSets.clear()
                                    currentWeight = ""
                                    currentReps = ""
                                    stopRestTimer()
                                    searchQuery = ""
                                    subView = WorkoutSubView.LogExercise
                                }
                            )
                        }
                    }
                }
            }
        }

        // ── Log Exercise subview ─────────────────────────────────────────────
        subView == WorkoutSubView.LogExercise && selectedExercise != null -> {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(Color(0xFFF8F9FA))
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { showDiscardDialog = true }) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = DarkGray)
                    }
                    Text(
                        selectedExercise!!.name,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = DarkGray,
                        maxLines = 1,
                        modifier = Modifier.weight(1f).padding(start = 8.dp)
                    )
                }

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    // Rest timer banner
                    if (restTimerActive) {
                        item {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Blue500)
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Filled.Timer, contentDescription = null, tint = Color.White)
                                Text(
                                    "Rest: ${formatMS(restTimeLeft)}",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.weight(1f).padding(horizontal = 8.dp)
                                )
                                IconButton(onClick = { stopRestTimer() }) {
                                    Icon(Icons.Filled.Close, contentDescription = "Stop rest", tint = Color.White)
                                }
                            }
                            Spacer(Modifier.height(8.dp))
                        }
                    }

                    // Rest timer config
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(2.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Filled.Timer, contentDescription = null, tint = MedGray, modifier = Modifier.size(20.dp))
                                Text(
                                    "Rest timer: ${formatMS(restTimerDuration)}",
                                    color = MedGray,
                                    modifier = Modifier.weight(1f).padding(horizontal = 8.dp)
                                )
                                IconButton(
                                    onClick = { viewModel.updateRestTimerDuration(restTimerDuration - 15) },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(Icons.Filled.Remove, contentDescription = "Decrease", tint = MedGray)
                                }
                                IconButton(
                                    onClick = { viewModel.updateRestTimerDuration(restTimerDuration + 15) },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(Icons.Filled.Add, contentDescription = "Increase", tint = MedGray)
                                }
                            }
                        }
                        Spacer(Modifier.height(8.dp))
                    }

                    // Sets table
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(modifier = Modifier.fillMaxWidth()) {
                                    Text("SET", fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, color = MedGray, modifier = Modifier.weight(0.6f))
                                    Text("WEIGHT (kg)", fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, color = MedGray, modifier = Modifier.weight(1.8f))
                                    Text("REPS", fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, color = MedGray, modifier = Modifier.weight(1f))
                                }
                                Spacer(Modifier.height(8.dp))
                                if (currentSets.isEmpty()) {
                                    Text("No sets logged yet.", color = LightGray, fontSize = 13.sp)
                                }
                                currentSets.forEachIndexed { idx, set ->
                                    val bg = if (idx % 2 == 0) Color(0xFFF8F9FA) else Color.White
                                    Row(
                                        modifier = Modifier.fillMaxWidth().background(bg).padding(vertical = 6.dp)
                                    ) {
                                        Text("${idx + 1}", modifier = Modifier.weight(0.6f), color = DarkGray)
                                        Text(
                                            if (set.weight > 0) set.weight.toString() else "—",
                                            modifier = Modifier.weight(1.8f),
                                            color = DarkGray
                                        )
                                        Text("${set.reps}", modifier = Modifier.weight(1f), color = DarkGray)
                                    }
                                }
                            }
                        }
                        Spacer(Modifier.height(8.dp))
                    }

                    // Set input form
                    item {
                        var repsError by remember { mutableStateOf(false) }
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    "Set ${currentSets.size + 1}",
                                    fontWeight = FontWeight.ExtraBold,
                                    color = DarkGray,
                                    fontSize = 16.sp
                                )
                                Spacer(Modifier.height(12.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    OutlinedTextField(
                                        value = currentWeight,
                                        onValueChange = { currentWeight = it },
                                        label = { Text("Weight (kg)") },
                                        keyboardOptions = KeyboardOptions(
                                            keyboardType = KeyboardType.Decimal,
                                            imeAction = ImeAction.Next
                                        ),
                                        singleLine = true,
                                        modifier = Modifier.weight(1f)
                                    )
                                    OutlinedTextField(
                                        value = currentReps,
                                        onValueChange = { currentReps = it; repsError = false },
                                        label = { Text("Reps") },
                                        isError = repsError,
                                        keyboardOptions = KeyboardOptions(
                                            keyboardType = KeyboardType.Number,
                                            imeAction = ImeAction.Done
                                        ),
                                        keyboardActions = KeyboardActions(
                                            onDone = {
                                                val r = currentReps.toIntOrNull()
                                                if (r == null || r <= 0) {
                                                    repsError = true
                                                } else {
                                                    val w = currentWeight.toDoubleOrNull() ?: 0.0
                                                    currentSets.add(WorkoutSet(w, r))
                                                    currentWeight = ""
                                                    currentReps = ""
                                                    repsError = false
                                                    startRestTimer()
                                                }
                                            }
                                        ),
                                        singleLine = true,
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                                if (repsError) {
                                    Text("Enter a valid rep count.", color = Red, fontSize = 12.sp)
                                }
                                Spacer(Modifier.height(12.dp))
                                Button(
                                    onClick = {
                                        val r = currentReps.toIntOrNull()
                                        if (r == null || r <= 0) {
                                            repsError = true
                                        } else {
                                            val w = currentWeight.toDoubleOrNull() ?: 0.0
                                            currentSets.add(WorkoutSet(w, r))
                                            currentWeight = ""
                                            currentReps = ""
                                            repsError = false
                                            startRestTimer()
                                        }
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(containerColor = Green500),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Icon(Icons.Filled.Add, contentDescription = null)
                                    Spacer(Modifier.width(8.dp))
                                    Text("LOG SET", fontWeight = FontWeight.ExtraBold)
                                }
                            }
                        }
                    }
                }

                // Complete exercise bar
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .padding(16.dp)
                ) {
                    Button(
                        onClick = {
                            if (currentSets.isNotEmpty()) {
                                viewModel.addExerciseToWorkout(selectedExercise!!, currentSets.toList())
                                currentSets.clear()
                                selectedExercise = null
                                stopRestTimer()
                                subView = WorkoutSubView.None
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = currentSets.isNotEmpty(),
                        colors = ButtonDefaults.buttonColors(containerColor = Green500),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(vertical = 16.dp)
                    ) {
                        Icon(Icons.Filled.Check, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("COMPLETE EXERCISE", fontWeight = FontWeight.ExtraBold)
                    }
                }
            }
        }

        // ── Active workout dashboard ─────────────────────────────────────────
        else -> {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(Color(0xFFF8F9FA))
            ) {
                // Timer bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.Timer, contentDescription = null, tint = DarkGray)
                    Spacer(Modifier.width(8.dp))
                    Text(
                        formatHMS(timer),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black,
                        color = DarkGray,
                        modifier = Modifier.weight(1f)
                    )
                    FilledTonalButton(
                        onClick = { showFinishDialog = true },
                        colors = ButtonDefaults.filledTonalButtonColors(containerColor = Red)
                    ) {
                        Icon(Icons.Filled.Stop, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Finish", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(16.dp)
                ) {
                    item {
                        Text(
                            "Workout in Progress",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black,
                            color = DarkGray,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                    }

                    val currentExercises = activeWorkout?.exercises ?: emptyList()
                    if (currentExercises.isEmpty()) {
                        item {
                            Text(
                                "Tap "Add Exercise" to start logging!",
                                color = LightGray,
                                modifier = Modifier.padding(vertical = 8.dp)
                            )
                        }
                    } else {
                        items(currentExercises) { ex ->
                            Card(
                                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(2.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            modifier = Modifier
                                                .size(36.dp)
                                                .clip(CircleShape)
                                                .background(Green500),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(Icons.Filled.FitnessCenter, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                                        }
                                        Spacer(Modifier.width(10.dp))
                                        Text(ex.name, fontWeight = FontWeight.ExtraBold, color = DarkGray, fontSize = 16.sp)
                                    }
                                    Spacer(Modifier.height(8.dp))
                                    ex.sets.forEachIndexed { idx, set ->
                                        Text(
                                            "Set ${idx + 1}: ${set.reps} reps${if (set.weight > 0) " @ ${set.weight} kg" else ""}",
                                            color = MedGray,
                                            fontSize = 13.sp
                                        )
                                    }
                                }
                            }
                        }
                    }

                    item { Spacer(Modifier.height(80.dp)) }
                }

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .padding(16.dp)
                ) {
                    Button(
                        onClick = { subView = WorkoutSubView.AddExercise },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Green500),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(vertical = 16.dp)
                    ) {
                        Icon(Icons.Filled.Add, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("ADD EXERCISE", fontWeight = FontWeight.ExtraBold)
                    }
                }
            }
        }
    }
}

@Composable
private fun ExercisePickItem(exercise: Exercise, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(2.dp),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(exercise.name, fontWeight = FontWeight.ExtraBold, color = DarkGray, maxLines = 1, fontSize = 16.sp)
                Text("${exercise.category} · ${exercise.equipment}", color = MedGray, fontSize = 13.sp, modifier = Modifier.padding(top = 2.dp))
            }
            Icon(Icons.Filled.Add, contentDescription = "Add", tint = Green500)
        }
    }
}
