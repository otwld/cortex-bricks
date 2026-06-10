import baseConfig from "../../../eslint.config.mjs";

export default [
    ...baseConfig,
    {
        files: [
            "**/*.json"
        ],
        rules: {
            "@nx/dependency-checks": [
                "error",
                {
                    ignoredFiles: [
                        "{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}",
                        "{projectRoot}/vitest.config.{js,cjs,mjs,ts,cts,mts}",
                        "{projectRoot}/src/**/*.spec.ts"
                    ],
                    ignoredDependencies: [
                        "@nestjs/common",
                        "@nestjs/core",
                        "@nestjs/graphql",
                        "@nestjs/mongoose",
                        "@nestjs/swagger",
                        "@otwld/nest-sdk",
                        "@otwld/ts-feature-flags",
                        "@otwld/ts-sdk",
                        "class-transformer",
                        "class-validator",
                        "express",
                        "graphql",
                        "mongoose",
                        "rxjs"
                    ]
                }
            ]
        },
        languageOptions: {
            parser: await import("jsonc-eslint-parser")
        }
    }
];
