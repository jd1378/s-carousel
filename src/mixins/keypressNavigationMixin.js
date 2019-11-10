const keypressNavigationMixin = {
  mounted() {
    window.addEventListener('keydown', this.keypressNavigation)
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.keypressNavigation)
  },
  methods: {
    isInView() {
      // check a shared property for deciding which slider to navigate in current page
      // the idea is to select and navigate the one in view, if there are more than one in view,
      // then the one which is closer to the center
    },
    keypressNavigation(e) {
      if (e.keyCode === 37) {
        this.prevSlide()
        e.preventDefault()
        e.stopImmediatePropagation()
      }

      if (e.keyCode === 39) {
        this.nextSlide()
        e.preventDefault()
        e.stopImmediatePropagation()
      }
    }
  }
}

export default keypressNavigationMixin
