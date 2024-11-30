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

const binsRotation = ['G', 'C', 'A', 'F', 'E', 'B', 'H', 'C'];
  
  const binSchedule = binDates.map((week, index) => ({
    week,
    person: binsRotation[index % binsRotation.length],
    note: index === 0 ? 'Current Week' : (index === binsRotation.length ? 'Cycle Repeats' : '')
  }));

</script>

<div class="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 py-4 sm:py-8 px-2 sm:px-4">
  <div class="max-w-4xl mx-auto">
    <!-- Header Section -->
    <div class="mb-4 sm:mb-8">
      <h1 class="text-2xl sm:text-3xl font-bold text-center mb-2">House Schedule</h1>
      <p class="text-center text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Track and manage house cleaning responsibilities</p>
      
      <div class="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700 mb-6 sm:mb-8">
        <h2 class="text-base sm:text-lg font-bold mb-1 sm:mb-2">Cleaning Rotation</h2>
        <p class="text-gray-400 text-sm">Order: B → A → F → C → E → A (repeats)</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6">
      <button
        class="flex-1 py-3 px-4 sm:px-6 rounded-lg text-base sm:text-lg font-medium transition-all duration-200 {activeTab === 'cleaning' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
        on:click={() => activeTab = 'cleaning'}>
        <span class="flex items-center justify-center">🧹 <span class="ml-2">Bathroom</span></span>
      </button>
      <button
        class="flex-1 py-3 px-4 sm:px-6 rounded-lg text-base sm:text-lg font-medium transition-all duration-200 {activeTab === 'bins' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
        on:click={() => activeTab = 'bins'}>
        <span class="flex items-center justify-center">🗑️ <span class="ml-2">Bins</span></span>
      </button>
    </div>

    <!-- Loading State -->
    {#if loading}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    {:else}
      <!-- Cleaning Schedule -->
      {#if activeTab === 'cleaning'}
        <div class="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          <div class="p-4 sm:p-6 border-b border-gray-700">
            <h2 class="text-lg sm:text-xl font-bold text-white">Top Floor Bathroom Cleaning</h2>
            <p class="text-gray-400 text-sm mt-1">Every 2 Weeks</p>
          </div>
          
          <!-- Desktop Headers -->
          <div class="hidden sm:grid grid-cols-5 gap-4 bg-gray-700 p-4 text-sm font-medium text-gray-300">
            <div>Week</div>
            <div>Person</div>
            <div>Task</div>
            <div>Note</div>
            <div>Status</div>
          </div>
          
          <!-- Schedule Items -->
          {#each cleaningSchedule as schedule}
            <!-- Mobile View -->
            <div class="block sm:hidden p-4 border-b border-gray-700 {schedule.note === 'Current Week' ? 'bg-blue-900/20' : ''}">
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <div class="font-medium text-white">Room {schedule.person}</div>
                  <label class="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={completedTasks[`cleaning-${schedule.week}-${schedule.person}`] || false}
                      on:change={(e) => handleTaskComplete('cleaning', schedule.week, schedule.person, e.target.checked)}
                      class="form-checkbox h-6 w-6 touch-manipulation"
                    />
                    <span class="ml-2 text-sm text-gray-400">
                      {completedTasks[`cleaning-${schedule.week}-${schedule.person}`] ? 'Done' : 'Pending'}
                    </span>
                  </label>
                </div>
                <div class="text-sm text-gray-300">{schedule.week}</div>
                <div class="text-sm text-gray-300">{schedule.task}</div>
                {#if schedule.note}
                  <div class="text-sm text-blue-400 font-medium">{schedule.note}</div>
                {/if}
              </div>
            </div>

            <!-- Desktop View -->
            <div class="hidden sm:grid grid-cols-5 gap-4 p-4 border-b border-gray-700 hover:bg-gray-750 transition-colors {schedule.note === 'Current Week' ? 'bg-blue-900/20' : ''}">
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
                    class="form-checkbox h-5 w-5"
                  />
                  <span class="ml-2 text-sm text-gray-400">
                    {completedTasks[`cleaning-${schedule.week}-${schedule.person}`] ? 'Done' : 'Pending'}
                  </span>
                </label>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <!-- Bins Schedule -->
        <div class="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          <div class="p-4 sm:p-6 border-b border-gray-700">
            <h2 class="text-lg sm:text-xl font-bold text-white">Bins Schedule</h2>
            <p class="text-gray-400 text-sm mt-1">Every Monday Night</p>
          </div>
          
          <!-- Desktop Headers -->
          <div class="hidden sm:grid grid-cols-4 gap-4 bg-gray-700 p-4 text-sm font-medium text-gray-300">
            <div>Week</div>
            <div>Person</div>
            <div>Note</div>
            <div>Status</div>
          </div>
          
          <!-- Schedule Items -->
          {#each binSchedule as schedule}
            <!-- Mobile View -->
            <div class="block sm:hidden p-4 border-b border-gray-700 {schedule.note === 'Current Week' ? 'bg-blue-900/20' : ''}">
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <div class="font-medium text-white">Room {schedule.person}</div>
                  <label class="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={completedTasks[`bins-${schedule.week}-${schedule.person}`] || false}
                      on:change={(e) => handleTaskComplete('bins', schedule.week, schedule.person, e.target.checked)}
                      class="form-checkbox h-6 w-6 touch-manipulation"
                    />
                    <span class="ml-2 text-sm text-gray-400">
                      {completedTasks[`bins-${schedule.week}-${schedule.person}`] ? 'Done' : 'Pending'}
                    </span>
                  </label>
                </div>
                <div class="text-sm text-gray-300">{schedule.week}</div>
                {#if schedule.note}
                  <div class="text-sm text-blue-400 font-medium">{schedule.note}</div>
                {/if}
              </div>
            </div>

            <!-- Desktop View -->
            <div class="hidden sm:grid grid-cols-4 gap-4 p-4 border-b border-gray-700 hover:bg-gray-750 transition-colors {schedule.note === 'Current Week' ? 'bg-blue-900/20' : ''}">
              <div class="text-gray-300">{schedule.week}</div>
              <div class="font-medium text-white">Room {schedule.person}</div>
              <div class="text-blue-400 font-medium">{schedule.note || ''}</div>
              <div>
                <label class="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={completedTasks[`bins-${schedule.week}-${schedule.person}`] || false}
                    on:change={(e) => handleTaskComplete('bins', schedule.week, schedule.person, e.target.checked)}
                    class="form-checkbox h-5 w-5"
                  />
                  <span class="ml-2 text-sm text-gray-400">
                    {completedTasks[`bins-${schedule.week}-${schedule.person}`] ? 'Done' : 'Pending'}
                  </span>
                </label>
              </div>
            </div>
          {/each}
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
    @apply rounded border-gray-600 bg-gray-700 text-blue-600;
    appearance: none;
    padding: 0;
    print-color-adjust: exact;
    display: inline-block;
    vertical-align: middle;
    background-origin: border-box;
    user-select: none;
    flex-shrink: 0;
    height: 1rem;
    width: 1rem;
    color: #3182ce;
    background-color: #2d3748;
    border-width: 1px;
    border-radius: 0.25rem;
    transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }

  .form-checkbox:checked {
    background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
    border-color: transparent;
    background-color: currentColor;
    background-size: 100% 100%;
    background-position: center;
    background-repeat: no-repeat;
  }

  .touch-manipulation {
    touch-action: manipulation;
  }

  /* Improved touch targets for mobile */
  @media (max-width: 640px) {
    .form-checkbox {
      height: 1.5rem;
      width: 1.5rem;
    }
  }
  
  /* Smooth transitions */
  button {
    @apply transition-all duration-200;
  }

  /* Animation for current week highlight */
  .bg-blue-900\/20 {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .8;
    }
  }
</style>