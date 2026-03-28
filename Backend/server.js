const app = require('./src/app');
const connectDB = require('./src/config/database');
const config = require('./src/config/config');


async function startServer(){
    await connectDB();
    const port = process.env.PORT || 5000;

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

startServer().catch((error) => {
    console.error('Failed to start server:', error);
});
