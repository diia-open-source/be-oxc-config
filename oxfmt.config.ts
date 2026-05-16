import { defineConfig } from 'oxfmt'

export default defineConfig({
    printWidth: 140,
    tabWidth: 4,
    useTabs: false,
    semi: false,
    singleQuote: true,
    trailingComma: 'all',
    insertFinalNewline: true,

    sortImports: {
        order: 'asc',
        ignoreCase: false,
        newlinesBetween: true,
        internalPattern: ['#'],
        groups: [
            'builtin',
            'external',
            'diia-app',
            'diia-packages',
            'src-root',
            'actions',
            'services',
            'providers',
            'models',
            'data-mappers',
            'utils',
            'mocks',
            'tests',
            'interfaces',
            'internal',
            ['parent', 'sibling', 'index'],
        ],
        customGroups: [
            {
                groupName: 'diia-app',
                elementNamePattern: ['@diia-inhouse/diia-app'],
            },
            {
                groupName: 'diia-packages',
                elementNamePattern: ['@diia-inhouse/**'],
            },
            {
                groupName: 'src-root',
                elementNamePattern: ['@src/**', '#src/**'],
            },
            {
                groupName: 'actions',
                elementNamePattern: ['@actions/**', '#actions/**'],
            },
            {
                groupName: 'services',
                elementNamePattern: ['@services/**', '#services/**'],
            },
            {
                groupName: 'providers',
                elementNamePattern: ['@providers/**', '#providers/**'],
            },
            {
                groupName: 'models',
                elementNamePattern: ['@models/**', '#models/**'],
            },
            {
                groupName: 'data-mappers',
                elementNamePattern: ['@dataMappers/**', '#dataMappers/**'],
            },
            {
                groupName: 'utils',
                elementNamePattern: ['@utils', '@utils/**', '#utils', '#utils/**'],
            },
            {
                groupName: 'mocks',
                elementNamePattern: ['@mocks/**', '#mocks/**'],
            },
            {
                groupName: 'tests',
                elementNamePattern: ['@tests/**', '#tests/**'],
            },
            {
                groupName: 'interfaces',
                elementNamePattern: ['@interfaces/**', '#interfaces/**'],
            },
        ],
    },

    sortPackageJson: false,

    ignorePatterns: ['dist', 'node_modules', 'src/generated', 'coverage'],
})
