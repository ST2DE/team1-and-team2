var app = new Vue({
    el: '#app',
    data: {
        isPanelOpen: false
    },
    methods: {
        togglePanel: function() {
            this.isPanelOpen = !this.isPanelOpen
        }
    },
    computed: {
        shouldPanelShow: function() {
            return {
                left: (this.isPanelOpen) ? 0 : '-33%'
            }
        }
    }
})