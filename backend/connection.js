import mongoose from 'mongoose'
import dns from 'node:dns'

export default async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is missing. Add your Atlas connection string to backend/.env.')
  }

  const dnsServers = process.env.DNS_SERVERS
    ?.split(',')
    .map((server) => server.trim())
    .filter(Boolean)

  if (dnsServers?.length) dns.setServers(dnsServers)

  await mongoose.connect(uri)
  console.log('Connected to MongoDB.')
}
