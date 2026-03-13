package com.brand.fitnesstracker.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.filled.Height
import androidx.compose.material.icons.filled.MonitorWeight
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.brand.fitnesstracker.data.model.UserProfile
import com.brand.fitnesstracker.ui.theme.DarkGray
import com.brand.fitnesstracker.ui.theme.Green500
import com.brand.fitnesstracker.ui.theme.LightGray
import com.brand.fitnesstracker.viewmodel.WorkoutViewModel
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen(viewModel: WorkoutViewModel, innerPadding: PaddingValues) {
    val savedProfile by viewModel.userProfile.collectAsState()
    var name by remember(savedProfile.name) { mutableStateOf(savedProfile.name) }
    var weight by remember(savedProfile.weight) { mutableStateOf(savedProfile.weight) }
    var height by remember(savedProfile.height) { mutableStateOf(savedProfile.height) }
    var goal by remember(savedProfile.goal) { mutableStateOf(savedProfile.goal) }

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8F9FA))
            .padding(innerPadding)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White)
                .padding(vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            androidx.compose.foundation.layout.Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(CircleShape)
                    .background(Green500),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(56.dp))
            }
            Spacer(Modifier.height(14.dp))
            Text("User Profile", fontSize = 26.sp, fontWeight = FontWeight.Black, color = DarkGray)
            Text("Stored only on your device", fontSize = 14.sp, color = LightGray, fontWeight = FontWeight.SemiBold)
        }

        // Form
        Card(
            modifier = Modifier.fillMaxWidth().padding(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(2.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                ProfileField(
                    icon = Icons.Filled.Person,
                    label = "FULL NAME",
                    value = name,
                    onValueChange = { name = it },
                    placeholder = "e.g. John Doe"
                )
                Spacer(Modifier.height(16.dp))
                Row(modifier = Modifier.fillMaxWidth()) {
                    ProfileField(
                        icon = Icons.Filled.MonitorWeight,
                        label = "WEIGHT (KG)",
                        value = weight,
                        onValueChange = { weight = it },
                        placeholder = "75",
                        keyboardType = KeyboardType.Decimal,
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(Modifier.width(12.dp))
                    ProfileField(
                        icon = Icons.Filled.Height,
                        label = "HEIGHT (CM)",
                        value = height,
                        onValueChange = { height = it },
                        placeholder = "180",
                        keyboardType = KeyboardType.Decimal,
                        modifier = Modifier.weight(1f)
                    )
                }
                Spacer(Modifier.height(16.dp))
                ProfileField(
                    icon = Icons.Filled.TrackChanges,
                    label = "FITNESS GOAL",
                    value = goal,
                    onValueChange = { goal = it },
                    placeholder = "e.g. Build muscle, lose weight, run a 5k...",
                    singleLine = false,
                    minLines = 3
                )
                Spacer(Modifier.height(24.dp))
                Button(
                    onClick = {
                        viewModel.updateProfile(UserProfile(name, weight, height, goal))
                        scope.launch { snackbarHostState.showSnackbar("Profile saved!") }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Green500),
                    shape = RoundedCornerShape(14.dp),
                    contentPadding = PaddingValues(vertical = 16.dp)
                ) {
                    Icon(Icons.Filled.Save, contentDescription = null)
                    Spacer(Modifier.width(10.dp))
                    Text("SAVE DETAILS", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                }
            }
        }

        SnackbarHost(hostState = snackbarHostState, modifier = Modifier.padding(bottom = 8.dp))
    }
}

@Composable
private fun ProfileField(
    icon: ImageVector,
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    singleLine: Boolean = true,
    minLines: Int = 1,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 6.dp)) {
            Icon(icon, contentDescription = null, tint = Green500, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(6.dp))
            Text(label, fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, color = Color(0xFF636E72), letterSpacing = 0.8.sp)
        }
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, color = Color(0xFFB2BEC3)) },
            singleLine = singleLine,
            minLines = minLines,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        )
    }
}
