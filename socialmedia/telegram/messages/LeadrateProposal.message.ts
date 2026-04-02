import { LeadrateProposed } from 'savings/savings.leadrate.types';
import { formatCurrency } from 'utils/format';
import { AppUrl, ExplorerTxUrl } from 'utils/func-helper';

export function LeadrateProposalMessage(proposal: LeadrateProposed, currentRate: number): string {
	const d = new Date(proposal.nextChange * 1000);
	const u = currentRate === proposal.nextRate;

	return `
*New Leadrate Proposal* (${proposal.source.toUpperCase()})

Proposal Period: 7 days
Proposal Until: ${d.toString().split(' ').slice(0, 5).join(' ')}
Proposer: ${proposal.proposer}

Current Rate: ${formatCurrency(currentRate / 10000)}%
Proposed Rate: ${formatCurrency(proposal.nextRate / 10000)}%

${u ? '*Rate will remain unchanged*' : '*Rate can be applied after 7 days*'}

[Goto Governance](${AppUrl(`/governance`)})
[Explorer Transaction](${ExplorerTxUrl(proposal.txHash)})
                        `;
}
