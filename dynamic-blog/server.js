document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.filter-item').forEach(button => {
        button.addEventListener('click', (event) => {
            const filterValue = event.target.dataset.filter;

            // Reset active filter class
            document.querySelectorAll('.filter-item').forEach(item => item.classList.remove('active-filter'));
            event.target.classList.add('active-filter');

            // Show or hide posts based on the filter
            document.querySelectorAll('.post-box').forEach(post => {
                if (filterValue === 'all' || post.classList.contains(filterValue)) {
                    post.style.display = 'block';
                } else {
                    post.style.display = 'none';
                }
            });
        });
    });
});

