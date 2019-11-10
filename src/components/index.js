import Vue from 'vue';

// import all of components and register them globally with a prefix

// base components

const Components = {
    // base components
    
};

Object.keys(Components).forEach(name => {
    Vue.component(name, Components[name]);
});

export default Components;
