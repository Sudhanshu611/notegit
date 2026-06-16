// frontend/src/api/client.js
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

export default client
