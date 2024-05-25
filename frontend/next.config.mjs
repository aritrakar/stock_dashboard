/** @type {import('next').NextConfig} */
const nextConfig = {
    // Fix for CORS: Maps incoming requests to a different path, in this case, the backend URL
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://backend:5000/:path*', // Backend URL. Change to `backend` when using Docker container for backend
            },
        ];
    },
};

export default nextConfig;
