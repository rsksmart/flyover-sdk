import { Pegin } from '../api/bindings/PeginRoute'
import { Pegout } from '../api/bindings/PegoutRoute'
import { UserQuotes } from '../api/bindings/UserQuotesRoute'
import { GetProviders } from '../api/bindings/GetProvidersRoute'
import { Providers } from '../api/bindings/ProvidersRoute'
import {
  type ProviderDetailResponse as LiquidityProviderDetail,
  type LiquidityProvider as LiquidityProviderBase
} from './bindings/data-contracts'

export {
  type AcceptPeginRespose as AcceptedQuote,
  type LiquidityProvider as LiquidityProviderBase,
  type ProviderDetail,
  type ProviderDetailResponse as LiquidityProviderDetail,
  type PeginQuoteDTO as QuoteDetail,
  type PegoutQuoteDTO as PegoutQuoteDetail,
  type GetPeginQuoteResponse as Quote,
  type PeginQuoteRequest,
  type PegoutQuoteRequest,
  type GetPegoutQuoteResponse as PegoutQuote,
  type AcceptPegoutResponse as AcceptedPegoutQuote,
  type DepositEventDTO as DepositEvent,
  type PeginQuoteStatusDTO as PeginQuoteStatus,
  type RetainedPeginQuoteDTO as PeginQuoteStatusDetail,
  type PegoutQuoteStatusDTO as PegoutQuoteStatus,
  type AvailableLiquidityDTO as AvailableLiquidity,
  type PeginCreationDataDTO as PeginCreationData,
  type RecommendedOperationDTO as RecommendedOperation,
  PeginQuoteRequestRequiredFields as quoteRequestRequiredFields,
  GetPeginQuoteResponseRequiredFields as quoteRequiredFields,
  PeginQuoteDtoRequiredFields as quoteDetailRequiredFields,
  AcceptPeginResposeRequiredFields as acceptQuoteRequiredFields,
  LiquidityProviderRequiredFields as providerRequiredFields,
  PegoutQuoteRequestRequiredFields as pegoutQuoteRequestRequiredFields,
  PegoutQuoteDtoRequiredFields as pegoutQuoteDetailRequiredFields,
  GetPegoutQuoteResponseRequiredFields as pegoutQuoteRequiredFields
} from './bindings/data-contracts'

export type LiquidityProvider = LiquidityProviderBase & LiquidityProviderDetail

export const Routes = {
  getQuote: Pegin.PostGetQuotePath,
  acceptQuote: Pegin.PostAcceptQuotePath,
  acceptAuthenticatedQuote: Pegin.PostAcceptAuthenticatedQuotePath,
  getProviders: GetProviders.GetProvidersListPath,
  getPegoutQuote: Pegout.PostGetQuotesPath,
  acceptPegoutQuote: Pegout.PostAcceptQuotePath,
  acceptAuthenticatedPegoutQuote: Pegout.PostAcceptAuthenticatedQuotePath,
  userQuotes: UserQuotes.UserQuotesListPath,
  providerDetail: Providers.DetailsListPath,
  peginStatus: Pegin.StatusListPath,
  pegoutStatus: Pegout.StatusListPath,
  availableLiquidity: Providers.LiquidityListPath,
  recommendedPegin: Pegin.RecommendedListPath,
  recommendedPegout: Pegout.RecommendedListPath
} as const
