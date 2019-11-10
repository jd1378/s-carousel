<template>
  <div class="slider-wrapper">
    <div class="arrow-wrapper">
      <div v-if="hasArrow" class="arrow-holder">
        <i class="arrow left" @click.prevent="prevSlide"></i>
      </div>
      <div
        ref="slider"
        class="slider"
        :class="{ draggable: draggable, grabbing: dragging }"
        :style="{
          height: contentHeight,
          overflow: allowOverflow ? false : 'hidden'
        }"
        @mouseenter="setHover(true)"
        @mouseleave="setHover(false)"
      >
        <div v-if="debugging" class="middleindicator"></div>
        <div
          ref="sliderContent"
          class="slider-content"
          :class="{ noselect: noselect, nohighlight: nohighlight }"
          :style="{
            transform: transformStyle,
            transition: transitionStyle
          }"
          @heightChange="heightChangeHandler"
        >
          <slot></slot>
        </div>
      </div>
      <div v-if="hasArrow" class="arrow-holder" @click.prevent="nextSlide">
        <i class="arrow right"></i>
      </div>
    </div>
    <div v-if="!noDots" class="dots-wrapper">
      <template v-for="n in childrenCount">
        <a
          :key="n"
          href="#"
          class="dot"
          :class="{
            'dot--active': selectedIndex === n - 1
          }"
          :style="{
            'margin-right': dotsGap + 'px',
            'background-color': dotColor
          }"
          @click.prevent="selectedIndex !== n - 1 && selectSlide(n - 1)"
        >
        </a>
      </template>
    </div>
  </div>
</template>

<script>
import debounce from "../utils/debounce";
import CSSHelper from "../utils/CSSHelper";
import dragMixin from "../mixins/dragMixin";

/**
 * I got an idea for writing this slider partially from another slider by observing the html elements behaviours,
 * So the slider idea is probably for someone else but the codes below are my work, Except:
 * few namings,small snippets of codes that are taken from other carousel packages as follows:
 *    https://github.com/SSENSE/vue-carousel/:
 *      - easing property
 *    https://github.com/baianat/hooper:
 *      - property namings : loop, autoplay
 * So an special thanks to them , their work is much cleaner,
 *  but I needed a few special things, and I had not seen those packages yet,
 *  so I made this component and found about them later (and improved my code based on them),
 *  though still they didn't provide what i needed :)
 *  Feel free to suggest changes or request new features, I may add them when I have the time
 *  *Also* if you really liked it and wanted to make me happy , you can always send a gift card of any type (steam preferred 😁) to my email 😋
 */
export default {
  mixins: [dragMixin],
  props: {
    allowOverflow: {
      type: Boolean
    },
    /**
     * Applies user-select none to slider to prevent text-selection
     */
    noselect: {
      type: Boolean,
      default: true
    },
    /**
     * disables tap highlighting
     */
    nohighlight: {
      type: Boolean,
      default: true
    },
    gapSize: {
      type: Number,
      default: 5
    },
    /**
     * show navigation arrows on sides
     */
    hasArrow: {
      type: Boolean
    },
    /**
     * display no dots
     */
    noDots: {
      type: Boolean,
      default: false
    },
    /**
     * The gap between dots in pixels
     */
    dotsGap: {
      type: Number,
      default: 6
    },
    dotColor: {
      type: String,
      default: "black"
    },
    selectedClass: {
      type: String,
      default: "slider__item--selected"
    },
    firstElement: {
      type: Number,
      default: 0
    },
    debugging: {
      type: Boolean,
      default: false
    },
    freeStyle: {
      type: Boolean,
      default: false
    },
    loop: {
      type: Boolean,
      default: true
    },
    animationSpeed: {
      type: Number,
      default: 300
    },
    autoplay: {
      type: Number,
      default: 0,
      validator: val => {
        // number should be positive
        return val >= 0;
      }
    },
    autoplayDirection: {
      type: String,
      default: "ltr",
      validator: val => {
        return ["ltr", "rtl"].includes(val);
      }
    },
    pauseOnHover: {
      type: Boolean,
      default: true
    },

    /**
     * Slide transition easing
     * Any valid CSS transition easing accepted
     */
    easing: {
      type: String,
      validator(value) {
        return (
          ["ease", "linear", "ease-in", "ease-out", "ease-in-out"].includes(
            value
          ) || value.includes("cubic-bezier")
        );
      },
      default: "ease"
    }
  },
  data() {
    return {
      currentX: 0,
      isHovered: false,
      selectedIndex: -1,
      lastSlideIndex: 0,
      contentHeight: 0,
      breakpoint: 99999999,
      initTouchX: 0,
      visibleContentWidth: 768,
      midPoint: 384,
      moving: false,
      movingTimout: undefined,
      autoplayInterval: undefined,
      children: undefined
    };
  },
  computed: {
    transitionStyle() {
      if (this.moving) {
        return `transform ${this.animationSpeed}ms ${this.easing}`;
      } else {
        return "";
      }
    },
    transformStyle() {
      if (this.dragging) {
        return `translate3d(${this.currentX}px,0,0)`;
      } else {
        return `translateX(${this.currentX}px)`;
      }
    },
    childrenCount() {
      if (this.children) {
        return this.children.length;
      } else {
        return 0;
      }
    }
  },
  mounted() {
    this.resizeHandler = debounce(this.resizeHandler, 500);
    this.recalculateMidPoint();
    window.addEventListener("resize", this.resizeHandler, true);
    this.styleChildren();
    this.selectFirst();
    this.initAutoplay();
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resizeHandler);
    if (this.autoplayInterval) clearInterval(this.autoplayInterval);
    if (this.movingTimout) clearTimeout(this.movingTimout);
  },
  methods: {
    heightChangeHandler() {
      this.contentHeight = this.children[0].offsetHeight + "px";
    },
    setHover(value) {
      this.isHovered = value;
    },

    initAutoplay() {
      if (this.autoplay) {
        this.autoplayInterval = setInterval(() => {
          if (this.dragging) {
            return;
          }
          if (this.pauseOnHover && this.isHovered) {
            return;
          }
          if (this.autoplay === "ltr") {
            this.nextSlide();
          } else {
            this.prevSlide();
          }
        }, this.autoplay);
      }
    },

    selectSlide(index) {
      if (this.movingTimout) {
        return;
      }
      this.moving = true;
      let forceRearrange = () => {};
      this.movingTimout = setTimeout(() => {
        this.moving = false;
        this.movingTimout = undefined;
        forceRearrange();
      }, this.animationSpeed);

      // if slider is looped
      if (this.loop) {
        // if we are on last item and going to first one (forward)
        if (this.selectedIndex === this.lastSlideIndex && index === 0) {
          // move to right and on the first item then reset position
          const amountToSlide =
            this.children[this.lastSlideIndex].clientWidth / 2 +
            this.children[0].clientWidth / 2 +
            this.gapSize;
          this.$_sslide_callback(-amountToSlide);
          forceRearrange = () => {
            this.rearrangeChildren(0);
          };
          return;
        }
        // else if we are on first item and going to last item (backward)
        else if (this.selectedIndex === 0 && index === this.lastSlideIndex) {
          // move to left and on the last item then reset position
          const amountToSlide =
            this.children[0].clientWidth / 2 +
            this.children[this.lastSlideIndex].clientWidth / 2 +
            this.gapSize;
          this.$_sslide_callback(amountToSlide);

          forceRearrange = () => {
            this.rearrangeChildren(this.lastSlideIndex);
          };
          return;
        }
      }
      this.rearrangeChildren(index);
    },
    nextSlide() {
      if (this.selectedIndex < this.lastSlideIndex) {
        this.selectSlide(this.selectedIndex + 1);
      } else if (this.loop && this.selectedIndex === this.lastSlideIndex) {
        this.selectSlide(0);
      }
    },
    prevSlide() {
      this.moving = true;
      if (this.selectedIndex > 0) {
        this.selectSlide(this.selectedIndex - 1);
      } else if (this.loop && this.selectedIndex === 0) {
        this.selectSlide(this.lastSlideIndex);
      }
    },

    recalculateMidPoint() {
      if (!this.$refs.slider) return;
      const boundingRect = this.$refs.slider.getBoundingClientRect();
      this.visibleContentWidth = this.$refs.slider.clientWidth;
      this.midPoint = boundingRect.left + boundingRect.width / 2;
    },

    resizeHandler() {
      this.recalculateMidPoint();
      this.rearrangeChildren(this.selectedIndex);
    },

    $_sslide_callback(movementX) {
      if (this.currentX + movementX > this.breakpoint) {
        // this.currentX = movementX
        this.currentX -= this.breakpoint;
        this.currentX += movementX;
      } else if (this.currentX + movementX < -this.breakpoint) {
        this.currentX += this.breakpoint;
        this.currentX += movementX;
      } else {
        this.currentX += movementX;
      }
      this.rearrangeChildren();
    },

    styleChildren() {
      this.children = this.$refs.sliderContent.children;
      this.lastSlideIndex = this.children.length - 1;
      if (this.children.length > 0) {
        this.contentHeight = this.children[0].offsetHeight + "px";
        const childWidth = this.children[0].clientWidth;
        this.breakpoint =
          childWidth * this.children.length +
          this.gapSize * this.children.length;
        // this.breakpoint = this.breakpoint / 2

        // this.currentX = this.breakpoint / 2

        for (let i = 0; i < this.children.length; i++) {
          this.children[i].style.position = "absolute";
        }
      }
    },

    calculateLeftPos(index) {
      const child = this.children[index];
      const childWidth = child.clientWidth;
      const left = childWidth * index + this.gapSize * index;
      return -left;
    },

    getMiddleStart(index) {
      return (
        this.calculateLeftPos(index) +
        this.visibleContentWidth / 2 -
        this.children[index].clientWidth / 2
      );
    },

    rearrangeChildren(toIndex) {
      // we do not support changing children yet
      // this.children = this.$refs.sliderContent.children

      let childInSelect = -1;

      if (toIndex !== undefined) {
        this.currentX = this.getMiddleStart(toIndex);
        childInSelect = toIndex;
      }

      for (let i = 0; i < this.children.length; i++) {
        const childWidth = this.children[i].clientWidth;
        let left = childWidth * i + this.gapSize * i;
        if (this.loop) {
          if (-left - childWidth < this.currentX - this.breakpoint) {
            left = -this.breakpoint + left;
          } else if (left + childWidth + this.currentX < 0) {
            left = this.breakpoint + left;
          }
        }

        this.children[i].style.left = left + "px";

        if (childInSelect === -1 && this.isInSelectionRange(this.children[i])) {
          childInSelect = i;
        }
      }

      if (childInSelect === -1) {
        childInSelect = 0;
      }

      this.applySelection(childInSelect);
    },

    isInSelectionRange(element) {
      const boundingRec = element.getBoundingClientRect();
      const halfGap = this.gapSize / 2;
      if (
        this.midPoint >= boundingRec.left - halfGap &&
        this.midPoint <= boundingRec.right + halfGap
      ) {
        // then we are on the element in center
        return true;
      }
      return false;
    },

    selectFirst() {
      this.rearrangeChildren(this.firstElement);
    },

    applySelection(index) {
      if (this.selectedIndex !== -1) {
        CSSHelper.removeClass(
          this.children[this.selectedIndex],
          this.selectedClass
        );
      }
      this.selectedIndex = index;
      CSSHelper.addClass(this.children[this.selectedIndex], this.selectedClass);
    },

    $_sslide_finishDragCallback() {
      if (this.freeStyle) {
        return;
      }

      this.selectSlide(this.selectedIndex);
    }
  }
};
</script>

<style lang="scss" scoped>
.slider-wrapper {
  height: auto;
  direction: ltr;

  .slider {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    width: 100%;
    justify-content: center;
    align-items: center;
    z-index: 1;
    position: relative;
    height: auto;

    &.draggable {
      cursor: grab;
    }

    &.grabbing {
      cursor: grabbing;
    }

    .slider-content {
      position: absolute;
      width: 100%;
      height: 100%;
    }
  }

  .middleindicator {
    width: 2px;
    height: 100px;
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 999;
    background-color: black;
  }

  .dots-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
  }

  .dot {
    height: 10px;
    width: 10px;
    border-radius: 50%;
    display: inline-block;
    opacity: 0.25;

    &.dot--active {
      opacity: 1;
    }
  }

  .arrow-wrapper {
    display: flex;
    align-items: center;
  }

  .arrow-holder {
    height: 100%;
  }

  i.arrow {
    border: solid rgb(79, 79, 79);
    border-width: 0 4px 4px 0;
    display: inline-block;

    padding: 0;
    vertical-align: middle;
    width: 20px;
    height: 20px;

    &:hover {
      border-color: rgb(157, 157, 157);
      cursor: pointer;
    }
    &.right {
      transform: rotate(-45deg);
      -webkit-transform: rotate(-45deg);
      margin-left: 5px;
    }

    &.left {
      transform: rotate(135deg);
      -webkit-transform: rotate(135deg);
      margin-right: 5px;
    }

    &.up {
      transform: rotate(-135deg);
      -webkit-transform: rotate(-135deg);
    }

    &.down {
      transform: rotate(45deg);
      -webkit-transform: rotate(45deg);
    }
  }

  .noselect {
    -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
    -khtml-user-select: none; /* Konqueror HTML */
    -moz-user-select: none; /* Old versions of Firefox */
    -ms-user-select: none; /* Internet Explorer/Edge */
    user-select: none;
    /* src: https://stackoverflow.com/a/4407335 */
  }

  .nohighlight {
    // disables highlighting when an element is tapped in mobile
    -webkit-tap-highlight-color: transparent;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  }
}
</style>
