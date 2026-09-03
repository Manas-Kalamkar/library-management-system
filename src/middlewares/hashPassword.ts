import bcrypt from 'bcrypt';

const saltRounds = 10


export const hashPassword = async (str: string) => {
    const salt = await bcrypt.genSalt(saltRounds)
    return bcrypt.hashSync(str, salt)
}


export const comparePassword = async (plain: string, hashPassword: string) => {
    return await bcrypt.compare(plain, hashPassword)
}