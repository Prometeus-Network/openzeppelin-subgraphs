import {
	Address,
	BigInt,
} from '@graphprotocol/graph-ts'

import {
	Account,
	ERC1155Contract,
	ERC1155Token,
	ERC1155Balance,
	ERC1155Operator,
} from '../../generated/schema'

import {
	IERC1155,
} from '../../generated/erc1155/IERC1155'

import {
	constants,
} from '@amxx/graphprotocol-utils'

import {
	fetchAccount,
} from '../fetch/account'

export function replaceURI(uri: string, identifier: BigInt): string {
	return uri.replaceAll(
		'{id}',
		identifier.toHex().slice(2).padStart(64, '0'),
	)
}

export function fetchERC1155(address: Address): ERC1155Contract {
	let account        = fetchAccount(address)
	let contract       = new ERC1155Contract(account.id)
	contract.asAccount = account.id
	account.asERC1155  = contract.id
	contract.save()
	account.save()

	return contract
}

export function fetchERC1155Token(contract: ERC1155Contract, identifier: BigInt, mintBlock: BigInt): ERC1155Token {
	let id = contract.id.concat('/').concat(identifier.toHex())
	let token = ERC1155Token.load(id)

	if (token == null) {
		let erc1155            = IERC1155.bind(Address.fromString(contract.id))
		let try_uri            = erc1155.try_uri(identifier)
		token                  = new ERC1155Token(id)
		token.contract         = contract.id
		token.identifier       = identifier
		token.totalSupply      = fetchERC1155Balance(token as ERC1155Token, null).id
		token.uri              = try_uri.reverted ? null : replaceURI(try_uri.value, identifier)
		if(mintBlock) { token.mintBlock = mintBlock; }
		token.save()
	}

	return token as ERC1155Token
}

export function fetchERC1155Balance(token: ERC1155Token, account: Account | null): ERC1155Balance {
	let id = token.id.concat('/').concat(account ? account.id : 'totalSupply')
	let balance = ERC1155Balance.load(id)

	if (balance == null) {
		balance            = new ERC1155Balance(id)
		balance.contract   = token.contract
		balance.token      = token.id
		balance.account    = account ? account.id : null
		balance.value      = constants.BIGDECIMAL_ZERO
		balance.valueExact = constants.BIGINT_ZERO
		balance.save()
	}

	return balance as ERC1155Balance
}

export function fetchERC721Operator(contract: ERC1155Contract, owner: Account, operator: Account): ERC1155Operator {
	let id = contract.id.concat('/').concat(owner.id).concat('/').concat(operator.id)
	let op = ERC1155Operator.load(id)

	if (op == null) {
		op          = new ERC1155Operator(id)
		op.contract = contract.id
		op.owner    = owner.id
		op.operator = operator.id
	}

	return op as ERC1155Operator
}
