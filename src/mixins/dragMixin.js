// Test via a getter in the options object to see if the passive property is accessed
let supportsPassive = false
try {
  const opts = Object.defineProperty({}, 'passive', {
    get() {
      supportsPassive = true
    }
  })
  window.addEventListener('testPassive', null, opts)
  window.removeEventListener('testPassive', null, opts)
} catch (e) {}

function captureClick(e) {
  // console.log('clickremoved ;)')
  e.stopPropagation() // Stop the click from being propagated.
  e.preventDefault()
  window.removeEventListener('click', captureClick, true) // cleanup
}

const dragMixin = {
  props: {
    draggable: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      dragging: false,
      dragStart: undefined
    }
  },

  methods: {
    $_sslide_startDrag(event) {
      if (!this.draggable) {
        return
      }
      if (event.button !== 0) {
        return
      }
      this.dragStart = { x: event.clientX, y: event.clientY }
      event.preventDefault()
      window.addEventListener('mousemove', this.$_sslide_mouseMove)
      this.dragging = true
    },

    $_sslide_startTouch(event) {
      if (!this.draggable) {
        return
      }
      window.addEventListener('touchmove', this.$_sslide_touchMove)
      this.initTouchX = event.touches[0].clientX
      this.dragging = true
    },

    $_sslide_endTouch(event) {
      window.removeEventListener('touchmove', this.$_sslide_touchMove)
      this.$_sslide_finishDrag(event)
    },

    $_sslide_mouseUpHandler(event) {
      if (this.dragging) {
        window.removeEventListener('mousemove', this.$_sslide_mouseMove)
        if (this.dragStart) {
          if (
            Math.abs(event.clientX - this.dragStart.x) > 10 ||
            Math.abs(event.clientY - this.dragStart.y) > 10
          ) {
            // the click effect is not intended
            window.addEventListener('click', captureClick, true)
          }
        }
        this.$_sslide_finishDrag(event)
      }
    },

    $_sslide_finishDrag(event) {
      if (!this.dragging) {
        return
      }
      this.dragging = false
      if (this.$_sslide_finishDragCallback) {
        this.$_sslide_finishDragCallback()
      }
    },

    $_sslide_mouseMove(event) {
      this.$_sslide_pointerMove(event.movementX)
    },

    $_sslide_touchMove(event) {
      this.$_sslide_pointerMove(event.touches[0].clientX - this.initTouchX)
      this.initTouchX = event.touches[0].clientX
    },

    $_sslide_pointerMove(movementX) {
      if (this.dragging) {
        this.$_sslide_callback(movementX)
      }
    }
  },
  mounted() {
    if (!this.$_sslide_callback) {
      throw new Error(
        "You must define '$_sslide_callback' method in your component"
      )
    }
    this.$refs.slider.addEventListener('mousedown', this.$_sslide_startDrag)
    window.addEventListener('mouseup', this.$_sslide_mouseUpHandler)
    this.$refs.slider.addEventListener(
      'touchstart',
      this.$_sslide_startTouch,
      supportsPassive
        ? {
            passive: true
          }
        : false
    )
    window.addEventListener('touchend', this.$_sslide_endTouch)
  },

  beforeDestroy() {
    this.$refs.slider.removeEventListener('mousedown', this.$_sslide_startDrag)
    window.removeEventListener('mouseup', this.$_sslide_mouseUpHandler)
    this.$refs.slider.removeEventListener(
      'touchstart',
      this.$_sslide_startTouch
    )
    window.removeEventListener('touchend', this.$_sslide_endTouch)
  }
}

export default dragMixin
