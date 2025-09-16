// Initialize Supabase with your credentials
const supabaseUrl = 'https://hxkmxesehefhypywbuqz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4a214ZXNlaGVmaHlweXdidXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjMwODEsImV4cCI6MjA3MjgzOTA4MX0.SqEx7_5Mf1AXT1TbEy6gFl5bm2eFS8SITkWXcEJcxSM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Global variables
let currentUser = null;
let courses = [];
let userEnrollments = [];

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthStatus();
    
    // Load all data
    loadCourses();
    loadResources();
    loadInstructors();
    loadTestimonials();
    loadStats();
    
    // Set up event listeners
    setupEventListeners();
});

// Check authentication status
async function checkAuthStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session && session.user) {
        currentUser = session.user;
        updateAuthUI();
        
        // Load user enrollments
        await loadUserEnrollments();
    }
}

// Update UI based on authentication status
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    
    if (currentUser) {
        authButtons.innerHTML = `
            <a href="cart.html" class="btn btn-outline-light position-relative me-3">
                <i class="fas fa-shopping-cart"></i>
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">0</span>
            </a>
            <div class="dropdown">
                <button class="btn btn-outline-light dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown">
                    <i class="fas fa-user me-1"></i> ${currentUser.email}
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="dashboard.html">Dashboard</a></li>
                    <li><a class="dropdown-item" href="profile.html">Profile</a></li>
                    <li><a class="dropdown-item" href="my-courses.html">My Courses</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="logoutButton">Logout</a></li>
                </ul>
            </div>
        `;
        
        // Add logout functionality
        document.getElementById('logoutButton').addEventListener('click', async function() {
            await supabase.auth.signOut();
            window.location.reload();
        });
    }
}

// Load courses from Supabase
async function loadCourses() {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('featured', true)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading courses:', error);
            return;
        }
        
        courses = data;
        renderCourses(data);
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// Render courses to the page
function renderCourses(coursesData) {
    const coursesContainer = document.getElementById('featuredCourses');
    
    if (!coursesData || coursesData.length === 0) {
        coursesContainer.innerHTML = `
            <div class="col-12 text-center">
                <p>No courses available at the moment.</p>
            </div>
        `;
        return;
    }
    
    coursesContainer.innerHTML = coursesData.map(course => {
        const isEnrolled = userEnrollments.some(enrollment => enrollment.course_id === course.id);
        
        return `
            <div class="col-md-4 mb-4">
                <div class="card">
                    <div class="position-relative">
                        <img src="${course.image_url}" class="card-img-top" alt="${course.title}">
                        <span class="category-badge">${course.level}</span>
                        ${isEnrolled ? '<span class="badge bg-success badge-availability">Enrolled</span>' : ''}
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${course.title}</h5>
                        <p class="card-text">${course.description}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="course-duration"><i class="fas fa-clock me-1"></i> ${course.duration}</span>
                            <span class="text-primary fw-bold">${course.price === 0 ? 'Free' : 'R' + course.price}</span>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent">
                        ${isEnrolled ? 
                            `<a href="course.html?id=${course.id}" class="btn btn-success w-100">Continue Learning</a>` : 
                            `<button class="btn btn-primary w-100 enroll-btn" data-course-id="${course.id}">Enroll Now</button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners to enroll buttons
    document.querySelectorAll('.enroll-btn').forEach(button => {
        button.addEventListener('click', function() {
            const courseId = this.getAttribute('data-course-id');
            enrollInCourse(courseId);
        });
    });
}

// Load user enrollments
async function loadUserEnrollments() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', currentUser.id);
        
        if (error) {
            console.error('Error loading enrollments:', error);
            return;
        }
        
        userEnrollments = data;
        
        // Re-render courses to update enrollment status
        if (courses.length > 0) {
            renderCourses(courses);
        }
    } catch (error) {
        console.error('Error loading enrollments:', error);
    }
}

// Enroll in a course
async function enrollInCourse(courseId) {
    if (!currentUser) {
        alert('Please login to enroll in courses');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('enrollments')
            .insert([
                { 
                    user_id: currentUser.id, 
                    course_id: courseId,
                    enrolled_at: new Date().toISOString()
                }
            ])
            .select();
        
        if (error) {
            console.error('Error enrolling in course:', error);
            alert('Error enrolling in course. Please try again.');
            return;
        }
        
        // Add to user enrollments
        userEnrollments.push(data[0]);
        
        // Re-render courses to update enrollment status
        renderCourses(courses);
        
        alert('Successfully enrolled in the course!');
    } catch (error) {
        console.error('Error enrolling in course:', error);
        alert('Error enrolling in course. Please try again.');
    }
}

// Load resources from Supabase
async function loadResources() {
    try {
        // Load videos
        const { data: videos, error: videosError } = await supabase
            .from('resources')
            .select('*')
            .eq('type', 'video')
            .order('created_at', { ascending: false });
        
        if (!videosError && videos) {
            renderResources(videos, 'videoResources');
        }
        
        // Load articles
        const { data: articles, error: articlesError } = await supabase
            .from('resources')
            .select('*')
            .eq('type', 'article')
            .order('created_at', { ascending: false });
        
        if (!articlesError && articles) {
            renderResources(articles, 'articleResources');
        }
        
        // Load webinars
        const { data: webinars, error: webinarsError } = await supabase
            .from('resources')
            .select('*')
            .eq('type', 'webinar')
            .order('created_at', { ascending: false });
        
        if (!webinarsError && webinars) {
            renderResources(webinars, 'webinarResources');
        }
        
        // Load guides
        const { data: guides, error: guidesError } = await supabase
            .from('resources')
            .select('*')
            .eq('type', 'guide')
            .order('created_at', { ascending: false });
        
        if (!guidesError && guides) {
            renderResources(guides, 'guideResources');
        }
    } catch (error) {
        console.error('Error loading resources:', error);
    }
}

// Render resources to the page
function renderResources(resources, containerId) {
    const container = document.getElementById(containerId);
    
    if (!resources || resources.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <p class="text-muted">No resources available at the moment.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = resources.map(resource => `
        <div class="col-md-6">
            <div class="resource-card">
                <h5>${resource.title}</h5>
                <p class="text-muted">${resource.description}</p>
                <a href="${resource.url}" class="btn btn-sm btn-outline-primary" target="_blank">
                    ${resource.type === 'video' ? 'Watch Now' : 
                      resource.type === 'article' ? 'Read Article' : 
                      resource.type === 'webinar' ? 'Register Now' : 'Download PDF'}
                </a>
            </div>
        </div>
    `).join('');
}

// Load instructors from Supabase
async function loadInstructors() {
    try {
        const { data, error } = await supabase
            .from('instructors')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading instructors:', error);
            return;
        }
        
        renderInstructors(data);
    } catch (error) {
        console.error('Error loading instructors:', error);
    }
}

// Render instructors to the page
function renderInstructors(instructors) {
    const container = document.getElementById('instructorsList');
    
    if (!instructors || instructors.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <p>No instructors available at the moment.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = instructors.map(instructor => `
        <div class="col-md-3 mb-4">
            <div class="instructor-card">
                <img src="${instructor.image_url}" class="instructor-img" alt="${instructor.name}">
                <h5>${instructor.name}</h5>
                <p class="text-muted">${instructor.specialization}</p>
                <p class="small">${instructor.experience}</p>
            </div>
        </div>
    `).join('');
}

// Load testimonials from Supabase
async function loadTestimonials() {
    try {
        const { data, error } = await supabase
            .from('testimonials')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading testimonials:', error);
            return;
        }
        
        renderTestimonials(data);
    } catch (error) {
        console.error('Error loading testimonials:', error);
    }
}

// Render testimonials to the page
function renderTestimonials(testimonials) {
    const container = document.getElementById('testimonialsList');
    
    if (!testimonials || testimonials.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <p>No testimonials available at the moment.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = testimonials.map(testimonial => `
        <div class="col-md-6 mb-4">
            <div class="testimonial">
                <p class="mb-3">"${testimonial.content}"</p>
                <div class="d-flex align-items-center">
                    <img src="${testimonial.image_url}" class="testimonial-img" alt="${testimonial.author}">
                    <div>
                        <h6 class="mb-0">${testimonial.author}</h6>
                        <small class="text-muted">${testimonial.position}</small>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load stats from Supabase
async function loadStats() {
    try {
        // Get farmers trained count
        const { count: farmersCount, error: farmersError } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true });
        
        if (!farmersError && farmersCount !== null) {
            document.getElementById('farmersTrained').textContent = `${farmersCount}+`;
        }
        
        // Get courses available count
        const { count: coursesCount, error: coursesError } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true });
        
        if (!coursesError && coursesCount !== null) {
            document.getElementById('coursesAvailable').textContent = `${coursesCount}+`;
        }
        
        // Get instructors count
        const { count: instructorsCount, error: instructorsError } = await supabase
            .from('instructors')
            .select('*', { count: 'exact', head: true });
        
        if (!instructorsError && instructorsCount !== null) {
            document.getElementById('expertInstructors').textContent = instructorsCount;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Search form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchTerm = document.getElementById('searchInput').value;
            searchCourses(searchTerm);
        });
    }
}