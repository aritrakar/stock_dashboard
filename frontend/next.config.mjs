/** @type {import('next').NextConfig} */
const nextConfig = {
    // Fix for CORS: Maps incoming requests to a different path, in this case, the backend URL
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://backend:5000/:path*', // Backend URL
                // headers: [
                //     {
                //         key: 'Access-Control-Allow-Origin',
                //         value: '*',
                //     },
                //     {
                //         key: 'Access-Control-Allow-Methods',
                //         value: 'GET, POST, PUT, DELETE, OPTIONS',
                //     },
                //     {
                //         key: 'Access-Control-Allow-Headers',
                //         value: 'X-Requested-With, Content-Type, Authorization',
                //     },
                // ],
            },
        ];
    },
};

export default nextConfig;
