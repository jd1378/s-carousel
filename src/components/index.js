import Vue from "vue";

// import all of components and register them globally with a prefix

// base components

import sCarousel from "./Carousel.vue";
const Components = {
  sCarousel
};

Object.keys(Components).forEach(name => {
  Vue.component(name, Components[name]);
});

export default Components;
