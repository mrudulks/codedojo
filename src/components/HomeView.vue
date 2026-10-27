<script setup lang="ts">
import BackupControls from './BackupControls.vue'
import DashboardPanel from './DashboardPanel.vue'
import TodayQueue from './TodayQueue.vue'
</script>

<template>
  <div class="home">
    <TodayQueue />
    <DashboardPanel />
    <BackupControls />
  </div>
</template>

<style scoped>
.home {
  display: grid;
  gap: 28px;
  max-width: 980px;
  margin: 0 auto;
  padding: 28px 24px 48px;
}
@media (max-width: 600px) {
  .home {
    padding: 16px 16px 40px;
    gap: 20px;
  }
}
</style>
