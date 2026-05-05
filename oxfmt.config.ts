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
        internalPattern: [],
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
                elementNamePattern: ['@src/**'],
            },
            {
                groupName: 'actions',
                elementNamePattern: ['@actions/**'],
            },
            {
                groupName: 'services',
                elementNamePattern: ['@services/**'],
            },
            {
                groupName: 'providers',
                elementNamePattern: ['@providers/**'],
            },
            {
                groupName: 'models',
                elementNamePattern: ['@models/**'],
            },
            {
                groupName: 'data-mappers',
                elementNamePattern: ['@dataMappers/**'],
            },
            {
                groupName: 'utils',
                elementNamePattern: ['@utils', '@utils/**'],
            },
            {
                groupName: 'mocks',
                elementNamePattern: ['@mocks/**'],
            },
            {
                groupName: 'tests',
                elementNamePattern: ['@tests/**'],
            },
            {
                groupName: 'interfaces',
                elementNamePattern: ['@interfaces/**'],
            },
        ],
    },

    sortPackageJson: false,

    ignorePatterns: ['dist', 'node_modules', 'src/generated', 'coverage'],
})
