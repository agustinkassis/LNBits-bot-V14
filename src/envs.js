require("dotenv").config()
const z = require("zod")

const envSchema = z.object({
    EMOJIS_CONFIG: z.string().min(1)
        .transform(text => text.split(","))
        .refine(items => items.length > 0, "Split emojis using comma (,). Example: '🥝:1,🟠:2'")
        .transform(items => items.map(item => item.split(":")))
        .refine(items => items.find(item => item.length !== 2) !== null, "Split config using semicolon (:). Example '🥝:1'")
        .transform(items => items.map(([emoji, value]) => ([emoji, z.number().int().nonnegative().parse(Number(value))])))
        .transform(items => items.map(([emoji, value]) => ({
            emoji,
            sats: value,
        }))),
    CLIENT_TOKEN: z.string().min(1),
    CLIENT_ID: z.string().min(1),
    MONGODB_URI: z.string().min(1),
    LNBITS_HOST: z.string().url(),
    POOL_ADDRESS: z.string().min(1),
    LNBITS_ADMIN_USER_ID: z.string().min(1),
    LNBITS_ADMIN_USER_ID: z.string().min(1),
})

console.log(envSchema.parse(process.env))

module.exports = envSchema.parse(process.env)
