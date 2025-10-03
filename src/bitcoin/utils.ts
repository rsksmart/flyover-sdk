import { Transaction } from 'bitcoinjs-lib'
import { type BitcoinDataSource } from './BitcoinDataSource'

export async function getRawTxWithoutWitnesses (btcTransactionHash: string, btcDataSource: BitcoinDataSource): Promise<string> {
  const btcHexTransaction = await btcDataSource.getTransactionAsHex(btcTransactionHash)

  const bitcoinJsTx = Transaction.fromHex(btcHexTransaction)
  bitcoinJsTx.ins.forEach(input => {
    input.witness = []
  })

  return bitcoinJsTx.toHex()
}
