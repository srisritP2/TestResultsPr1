<template>
  <div class="virtual-scroller" ref="container" @scroll="handleScroll">
    <div class="virtual-spacer" :style="{ height: totalHeight + 'px' }">
      <div class="virtual-content" :style="{ transform: `translateY(${offsetY}px)` }">
        <slot 
          v-for="item in visibleItems" 
          :key="item.id || item.name"
          :item="item"
          :index="item.index"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VirtualScroller',
  props: {
    items: Array,
    itemHeight: { type: Number, default: 100 },
    containerHeight: { type: Number, default: 600 },
    buffer: { type: Number, default: 5 }
  },
  data() {
    return {
      scrollTop: 0,
      containerEl: null
    };
  },
  computed: {
    totalHeight() {
      return this.items.length * this.itemHeight;
    },
    startIndex() {
      return Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.buffer);
    },
    endIndex() {
      const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
      return Math.min(this.items.length - 1, this.startIndex + visibleCount + this.buffer * 2);
    },
    visibleItems() {
      return this.items.slice(this.startIndex, this.endIndex + 1).map((item, index) => ({
        ...item,
        index: this.startIndex + index
      }));
    },
    offsetY() {
      return this.startIndex * this.itemHeight;
    }
  },
  methods: {
    handleScroll(event) {
      this.scrollTop = event.target.scrollTop;
    }
  },
  mounted() {
    this.containerEl = this.$refs.container;
  }
};
</script>

<style scoped>
.virtual-scroller {
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.virtual-spacer {
  position: relative;
}

.virtual-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}
</style>