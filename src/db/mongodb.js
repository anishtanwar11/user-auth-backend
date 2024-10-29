import mongoose from "mongoose"

const dbConnect = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI)
        console.log(`\n MongoDB connection !! DB HOST: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MongoDb Connection Error", error);
        process.exit(1)
    }
}
export default dbConnect;