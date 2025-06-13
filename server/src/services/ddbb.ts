import mongoose from 'mongoose';

export const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || '');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
};

export const disconnect = async () => {
    try {
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
        throw error;
    }
};

export const isConnected = () => {
    return mongoose.connection.readyState === 1; // 1 means connected
};

export const getConnection = () => {
    return mongoose.connection;
};

export const getDb = () => {
    return mongoose.connection.db;
};

export const getModel = (modelName: string) => {
    return mongoose.model(modelName);
};

export const useDatabase = async <T>(callback: () => Promise<T>): Promise<T> => {
    try {
        if (!isConnected()) {
            await connect();
        }
        return await callback();
    } catch (error) {
        console.error('Error using database:', error);
        throw error;
    }
}

const gracefulShutdown = async () => {
    if (isConnected()) {
        console.log('Disconnection from MongoDB...');
        await disconnect();
        console.log('Disconnected from MongoDB.');
    }
};

process.on('SIGINT', async () => {
    await gracefulShutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await gracefulShutdown();
    process.exit(0);
});