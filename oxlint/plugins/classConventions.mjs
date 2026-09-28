const accessibilities = ['public', 'protected', 'private', '#private']

const groupsOf = (type) => [
    ...accessibilities.map((accessibility) => `${accessibility}-static-${type}`),
    ...accessibilities.slice(0, 3).map((accessibility) => `${accessibility}-decorated-${type}`),
    ...accessibilities.map((accessibility) => `${accessibility}-instance-${type}`),
    ...accessibilities.slice(0, 2).map((accessibility) => `${accessibility}-abstract-${type}`),
    ...accessibilities.map((accessibility) => `${accessibility}-${type}`),
    `static-${type}`,
    `instance-${type}`,
    `abstract-${type}`,
    `decorated-${type}`,
    type,
]

// Mirrors the default order of @typescript-eslint/member-ordering, which the eslint config enforced before the oxc migration
const memberOrder = [
    'signature',
    'call-signature',
    ...groupsOf('field'),
    'static-initialization',
    'public-constructor',
    'protected-constructor',
    'private-constructor',
    'constructor',
    ...groupsOf('accessor'),
    ...groupsOf('get'),
    ...groupsOf('set'),
    ...groupsOf('method'),
]

const rankByGroup = new Map(memberOrder.map((group, rank) => [group, rank]))

const typeOf = (member) => {
    switch (member.type) {
        case 'TSIndexSignature': {
            return 'signature'
        }
        case 'TSCallSignatureDeclaration': {
            return 'call-signature'
        }
        case 'TSConstructSignatureDeclaration': {
            return 'constructor'
        }
        case 'StaticBlock': {
            return 'static-initialization'
        }
        case 'AccessorProperty':
        case 'TSAbstractAccessorProperty': {
            return 'accessor'
        }
        case 'TSPropertySignature': {
            return 'field'
        }
        case 'PropertyDefinition':
        case 'TSAbstractPropertyDefinition': {
            return ['ArrowFunctionExpression', 'FunctionExpression'].includes(member.value?.type) ? 'method' : 'field'
        }
        case 'MethodDefinition': {
            // Overload signatures can't be decorated, so ranking them would split a decorated implementation from its overloads
            return member.value.type === 'TSEmptyBodyFunctionExpression' ? undefined : member.kind
        }
        case 'TSAbstractMethodDefinition':
        case 'TSMethodSignature': {
            return member.kind
        }
        default: {
            return undefined
        }
    }
}

const groupsOfMember = (member, type, supportsModifiers) => {
    if (!supportsModifiers || type === 'signature' || type === 'static-initialization') {
        return [type]
    }

    const accessibility = member.key.type === 'PrivateIdentifier' ? '#private' : (member.accessibility ?? 'public')
    if (type === 'constructor') {
        return [`${accessibility}-constructor`, 'constructor']
    }

    const scope = member.static ? 'static' : member.type.startsWith('TSAbstract') ? 'abstract' : 'instance'
    const decorated = member.decorators?.length > 0

    return [
        ...(decorated ? [`${accessibility}-decorated-${type}`, `decorated-${type}`] : []),
        `${accessibility}-${scope}-${type}`,
        `${scope}-${type}`,
        `${accessibility}-${type}`,
        type,
    ]
}

const rankOf = (member, supportsModifiers) => {
    const type = typeOf(member)
    if (!type) {
        return -1
    }

    return rankByGroup.get(groupsOfMember(member, type, supportsModifiers).find((group) => rankByGroup.has(group)))
}

const hasInitializer = (member) => ['PropertyDefinition', 'AccessorProperty'].includes(member.type) && Boolean(member.value)

const initializes = (member) => member.type === 'StaticBlock' || hasInitializer(member)

const isStatic = (member) => member.type === 'StaticBlock' || Boolean(member.static)

const hasBlockBody = (member) =>
    member.type === 'StaticBlock' || (member.type === 'MethodDefinition' && member.value.type !== 'TSEmptyBodyFunctionExpression')

const keylessMemberNames = {
    StaticBlock: 'static block',
    TSIndexSignature: 'index signature',
    TSCallSignatureDeclaration: 'call',
    TSConstructSignatureDeclaration: 'new',
}

const disableDirective = /^\s*(?:eslint|oxlint)-disable(?:-next-line|-line)?(?:\s+([^]*?))?\s*(?:--|$)/

const disablesOrdering = (comment) => {
    const match = disableDirective.exec(comment.value)

    return Boolean(match) && (!match[1] || match[1].includes('member-ordering'))
}

export default {
    meta: { name: 'class-conventions' },
    rules: {
        'member-ordering': {
            meta: {
                type: 'suggestion',
                fixable: 'code',
                hasSuggestions: true,
                messages: {
                    incorrectGroupOrder: 'Member {{ name }} should be declared before all {{ group }} definitions.',
                    sortMembers: 'Sort members by group. This changes the order in which field initializers run.',
                    sortExemptMembers: 'Sort members by group. This also moves members exempted by a disable comment.',
                },
            },
            create(context) {
                const { sourceCode } = context

                const chunkOf = (member, previousEnd) => {
                    const leading = sourceCode
                        .getCommentsBefore(member)
                        .find((comment) => sourceCode.text.slice(previousEnd, comment.range[0]).includes('\n'))
                    const trailing = sourceCode
                        .getCommentsAfter(member)
                        .findLast((comment) => !sourceCode.text.slice(member.range[1], comment.range[0]).includes('\n'))

                    return { start: leading?.range[0] ?? member.range[0], end: trailing?.range[1] ?? member.range[1] }
                }

                // A moved field can end up before `[computed]`, `*generator`, `in()` or `instanceof()`, which would continue its initializer expression
                const needsSemicolon = (member, next, gap) => {
                    if (hasBlockBody(member) || [',', ';'].includes(sourceCode.getText(member).at(-1))) {
                        return false
                    }

                    return !gap.includes('\n') || (hasInitializer(member) && /^(?:[*[]|in\b|instanceof\b)/.test(sourceCode.getText(next)))
                }

                const sortFixOf = (body, members, supportsModifiers) => {
                    const chunks = members.map((member, index) =>
                        chunkOf(member, index === 0 ? body.range[0] + 1 : members[index - 1].range[1]),
                    )

                    const units = []
                    let first = 0
                    for (const [index, member] of members.entries()) {
                        const rank = rankOf(member, supportsModifiers)
                        if (rank !== -1) {
                            units.push({ first, last: index, rank })
                            first = index + 1
                        }
                    }

                    units.at(-1).last = members.length - 1

                    const sorted = units.toSorted((a, b) => a.rank - b.rank)
                    const gaps = units
                        .slice(1)
                        .map((unit, index) => sourceCode.text.slice(chunks[units[index].last].end, chunks[unit.first].start))
                    const textOf = (unit, next, gap) => {
                        const text = sourceCode.text.slice(chunks[unit.first].start, chunks[unit.last].end)
                        if (!next || !needsSemicolon(members[unit.last], members[next.first], gap)) {
                            return text
                        }

                        const semicolonAt = members[unit.last].range[1] - chunks[unit.first].start

                        return `${text.slice(0, semicolonAt)};${text.slice(semicolonAt)}`
                    }

                    const replacement = sorted
                        .map((unit, index) => textOf(unit, sorted[index + 1], gaps[index]) + (gaps[index] ?? ''))
                        .join('')
                    const fix = (fixer) => fixer.replaceTextRange([chunks[units[0].first].start, chunks.at(-1).end], replacement)

                    const initializationOrderOf = (ordered) =>
                        ordered
                            .flatMap((unit) => members.slice(unit.first, unit.last + 1))
                            .filter(initializes)
                            .toSorted((a, b) => Number(isStatic(a)) - Number(isStatic(b)))
                    const sortedInitializationOrder = initializationOrderOf(sorted)
                    const keepsInitializationOrder = initializationOrderOf(units).every(
                        (member, index) => member === sortedInitializationOrder[index],
                    )

                    if (!keepsInitializationOrder) {
                        return { suggest: [{ messageId: 'sortMembers', fix }] }
                    }

                    // Sorting the whole body would override a member someone deliberately exempted from the rule
                    if (sourceCode.getCommentsInside(body).some(disablesOrdering)) {
                        return { suggest: [{ messageId: 'sortExemptMembers', fix }] }
                    }

                    return { fix }
                }

                const nameOf = (member) => {
                    if (member.type in keylessMemberNames) {
                        return keylessMemberNames[member.type]
                    }

                    if (member.key.type === 'PrivateIdentifier') {
                        return `#${member.key.name}`
                    }

                    return member.key.type === 'Identifier' && !member.computed ? member.key.name : context.sourceCode.getText(member.key)
                }

                const checkOrder = (body, members, supportsModifiers) => {
                    const ranks = []
                    const misplaced = []
                    for (const member of members) {
                        const rank = rankOf(member, supportsModifiers)
                        if (rank === -1) {
                            continue
                        }

                        if (ranks.length === 0 || rank > ranks.at(-1)) {
                            ranks.push(rank)
                        } else if (rank < ranks.at(-1)) {
                            misplaced.push({ member, expected: Math.min(...ranks.filter((previous) => previous > rank)) })
                        }
                    }

                    if (misplaced.length === 0) {
                        return
                    }

                    // Every report carries the fix, so it survives when some of them are suppressed by a disable comment
                    const sortFix = sortFixOf(body, members, supportsModifiers)
                    for (const { member, expected } of misplaced) {
                        context.report({
                            node: member,
                            messageId: 'incorrectGroupOrder',
                            data: { name: nameOf(member), group: memberOrder[expected].replaceAll('-', ' ') },
                            ...sortFix,
                        })
                    }
                }

                return {
                    ClassBody(node) {
                        checkOrder(node, node.body, true)
                    },
                    TSInterfaceBody(node) {
                        checkOrder(node, node.body, false)
                    },
                    TSTypeLiteral(node) {
                        checkOrder(node, node.members, false)
                    },
                }
            },
        },
    },
}
