<script lang="ts">
  import { onMount } from 'svelte';
  import { createClient } from '@supabase/supabase-js';
  
  // Initialize Supabase client
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
  
  interface CompletedTask {
    id: string;
    room_number: string;
    task_type: string;
    week_start: string;
    completed: boolean;
    completed_at: string | null;
    created_at: string;
  }

  let activeTab = 'cleaning';
  let completedTasks: Record<string, boolean> = {};
  let loading = true;
  let error: string | null = null;

  async function fetchCompletedTasks() {
    try {
      const { data, error: supabaseError } = await supabase
        .from('completed_tasks')
        .select('*');
      
      if (supabaseError) throw supabaseError;

      const tasksMap: Record<string, boolean> = {};
      data?.forEach(task => {
        tasksMap[`${task.task_type}-${task.week_start}-${task.room_number}`] = task.completed;
      });
      
      completedTasks = tasksMap;
    } catch (e) {
      console.error('Error fetching tasks:', e);
      error = 'Failed to load completed tasks';
    } finally {
      loading = false;
    }
  }

  async function handleTaskComplete(taskType: string, weekStart: string, roomNumber: string, completed: boolean) {
    try {
      const { error: supabaseError } = await supabase
        .from('completed_tasks')
        .upsert({
          room_number: roomNumber,
          task_type: taskType,
          week_start: weekStart,
          completed: completed,
          completed_at: completed ? new Date().toISOString() : null
        }, {
          onConflict: 'room_number,task_type,week_start'
        });

      if (supabaseError) throw supabaseError;

      completedTasks = {
        ...completedTasks,
        [`${taskType}-${weekStart}-${roomNumber}`]: completed
      };
    } catch (e) {
      console.error('Error updating task:', e);
      error = 'Failed to update task';
    }
  }

  onMount(() => {
    fetchCompletedTasks();
  });

  // Generate dates for the entire year
  function generateDates(startDate: Date, weeks: number, interval: number = 2) {
    const dates = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < weeks; i += interval) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekStartStr = weekStart.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      const weekEndStr = weekEnd.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      dates.push(`${weekStartStr} - ${weekEndStr}`);
      currentDate.setDate(currentDate.getDate() + (7 * interval));
    }
    return dates;
  }

  // Generate dates starting from December 2, 2024
  const startDate = new Date(2024, 11, 2); // December 2, 2024
  const cleaningDates = generateDates(startDate, 52, 2); // Every 2 weeks for a year
  const binDates = generateDates(startDate, 52, 1); // Every week for a year

  // Cleaning rotation: B → A → F → C → E → A
  const cleaningRotation = ['B', 'A', 'F', 'C', 'E', 'A'];
  
  const cleaningSchedule = cleaningDates.map((week, index) => ({
    week,
    person: cleaningRotation[index % cleaningRotation.length],
    task: 'Bathroom Cleaning',
    note: index === 0 ? 'Current Week' : (index === cleaningRotation.length ? 'Cycle Repeats' : '')
  }));

  // Bins rotation: B → F → C → E → A
  const binsRotation = ['B', 'F', 'C', 'E', 'A'];
  
  const binSchedule = binDates.map((week, index) => ({
    week,
    person: binsRotation[index % binsRotation.length],
    note: index === 0 ? 'Current Week' : (index === binsRotation.length ? 'Cycle Repeats' : '')
  }));

</script>

<div class="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 py-8 px-4">
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-center mb-2">House Schedule</h1>
      <p class="text-center text-gray-400 mb-6">Track and manage house cleaning responsibilities</p>
      
      <div class="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-8">
        <h2 class="text-lg font-bold mb-2">Cleaning Rotation</h2>
        <p class="text-gray-400">Order: B → A → F → C → E → A (repeats)</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-4 mb-6">
      <button
        class="flex-1 py-3 px-6 rounded-lg text-lg font-medium transition-all duration-200 {activeTab === 'cleaning' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
        on:click={() => activeTab = 'cleaning'}>
        🧹 Bathroom Cleaning
      </button>
      <button
        class="flex-1 py-3 px-6 rounded-lg text-lg font-medium transition-all duration-200 {activeTab === 'bins' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
        on:click={() => activeTab = 'bins'}>
        🗑️ Bins Schedule
      </button>
    </div>

    {#if loading}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    {:else}
      {#if activeTab === 'cleaning'}
        <div class="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          <div class="p-6 border-b border-gray-700">
            <h2 class="text-xl font-bold text-white">Top Floor Bathroom Cleaning Schedule</h2>
            <p class="text-gray-400 text-sm mt-1">Every 2 Weeks</p>
          </div>
          
          <div class="p-4">
            <div class="rounded-lg overflow-hidden">
              <div class="grid grid-cols-5 gap-4 bg-gray-700 p-4 text-sm font-medium text-gray-300">
                <div>Week</div>
                <div>Person</div>
                <div>Task</div>
                <div>Note</div>
                <div>Status</div>
              </div>
              
              {#each cleaningSchedule as schedule}
                <div class="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 hover:bg-gray-750 transition-colors {schedule.note === 'Current Week' ? 'bg-blue-900/20' : ''}">
                  <div class="text-gray-300">{schedule.week}</div>
                  <div class="font-medium text-white">Room {schedule.person}</div>
                  <div class="text-gray-300">{schedule.task}</div>
                  <div class="text-blue-400 font-medium">{schedule.note || ''}</div>
                  <div>
                    <label class="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={completedTasks[`cleaning-${schedule.week}-${schedule.person}`] || false}
                        on:change={(e) => handleTaskComplete('cleaning', schedule.week, schedule.person, e.target.checked)}
                        class="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-600 bg-gray-700 focus:ring-blue-500"
                      />
                      <span class="ml-2 text-sm text-gray-400">
                        {completedTasks[`cleaning-${schedule.week}-${schedule.person}`] ? 'Done' : 'Pending'}
                      </span>
                    </label>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {:else}
        <div class="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          <div class="p-6 border-b border-gray-700">
            <h2 class="text-xl font-bold text-white">Bins Schedule</h2>
            <p class="text-gray-400 text-sm mt-1">Every Monday Night</p>
          </div>
          
          <div class="p-4">
            <div class="rounded-lg overflow-hidden">
              <div class="grid grid-cols-4 gap-4 bg-gray-700 p-4 text-sm font-medium text-gray-300">
                <div>Week</div>
                <div>Person</div>
                <div>Note</div>
                <div>Status</div>
              </div>
              
              {#each binSchedule as schedule}
                <div class="grid grid-cols-4 gap-4 p-4 border-b border-gray-700 hover:bg-gray-750 transition-colors {schedule.note === 'Current Week' ? 'bg-blue-900/20' : ''}">
                  <div class="text-gray-300">{schedule.week}</div>
                  <div class="font-medium text-white">Room {schedule.person}</div>
                  <div class="text-blue-400 font-medium">{schedule.note || ''}</div>
                  <div>
                    <label class="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={completedTasks[`bins-${schedule.week}-${schedule.person}`] || false}
                        on:change={(e) => handleTaskComplete('bins', schedule.week, schedule.person, e.target.checked)}
                        class="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-600 bg-gray-700 focus:ring-blue-500"
                      />
                      <span class="ml-2 text-sm text-gray-400">
                        {completedTasks[`bins-${schedule.week}-${schedule.person}`] ? 'Done' : 'Pending'}
                      </span>
                    </label>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  :global(body) {
    background: #1a202c; /* Equivalent to gray-900 in Tailwind CSS */
  }
  
  /* Custom checkbox styles */
  .form-checkbox {
    border-radius: 0.25rem; /* rounded */
    border-color: #4a5568; /* border-gray-600 */
    background-color: #2d3748; /* bg-gray-700 */
    color: #3182ce; /* text-blue-600 */
    outline: 2px solid transparent;
    outline-offset: 2px;
    transition: outline-color 0.2s;
    &:focus {
        outline-color: #3182ce; /* focus:ring-blue-500 */
    }
  }

  .test{
    background-color: red;
  }
  
  /* Smooth transitions */
  button {
    transition: all 0.2s;
  }
</style>