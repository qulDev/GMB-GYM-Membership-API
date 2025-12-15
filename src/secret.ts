import dotenv from 'dotenv'

dotenv.config({path: '.env'})

export const _PORT = process.env.PORT
export const _JWTSECRET = process.env.JWT_SECRET