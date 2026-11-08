<template>
  <div class="admin-responsive-table">
    <div class="admin-responsive-table__desktop">
      <slot name="desktop" />
    </div>
    <div class="admin-responsive-table__mobile">
      <slot name="mobile" />
    </div>
  </div>
</template>

<style scoped>
.admin-responsive-table__mobile {
  display: none;
}

@media (max-width: 959px) {
  .admin-responsive-table__desktop {
    display: none;
  }

  .admin-responsive-table__mobile {
    display: block;
  }
}
</style>
