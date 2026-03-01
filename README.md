type: "postgres",
    url: process.env.DATABASE_URL,
    ssl: true, // Required for Neon
    synchronize: true, // Set to false in production
    logging: false,
    entities: ["src/entity/**/*.ts"],
    migrations: ["src/migration/**/*.ts"],
    subscribers: ["src/subscriber/**/*.ts"],