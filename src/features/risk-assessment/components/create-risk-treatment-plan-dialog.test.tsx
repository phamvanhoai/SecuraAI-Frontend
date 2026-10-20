import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CreateRiskTreatmentPlanDialog } from './create-risk-treatment-plan-dialog';
vi.mock('../hooks/use-create-risk-treatment-plan', () => ({
  useRiskTreatmentPlanOptions: () => ({ data: { users: [], controls: [] }, isPending: false, isError: false }),
  useCreateRiskTreatmentPlan: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));
const state = vi.hoisted(() => ({ status: 'open' }));
vi.mock('../hooks/use-risk-register', () => ({ useRiskRecord: () => ({ data: { status: state.status, activeTreatmentPlan: null, acceptances: [], assessments: [] }, isPending: false, isError: false }) }));
vi.mock('@/components/feedback/toast', () => ({ useToast: () => ({ success: vi.fn() }) }));
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', ''); } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute('open'); } });
});
afterEach(() => { cleanup(); state.status = 'open'; });
describe('create Risk Treatment Plan', () => {
  it('shows cost justification instead of fake actions for Accept and preserves other strategies', () => {
    render(<CreateRiskTreatmentPlanDialog riskId='risk' riskLabel='Risk' onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Add action' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Treatment option'), { target: { value: 'accept' } });
    expect(screen.queryByRole('button', { name: 'Add action' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Cost to fix *')).toHaveValue('');
    expect(screen.getByLabelText('Expected loss *')).toHaveValue('');
    expect(screen.getByLabelText('Comparison period (months) *')).toHaveValue(12);
    fireEvent.change(screen.getByLabelText('Cost to fix *'), { target: { value: '100000000' } });
    fireEvent.change(screen.getByLabelText('Treatment option'), { target: { value: 'transfer' } });
    expect(screen.getByRole('button', { name: 'Add action' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Cost to fix *')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Treatment option'), { target: { value: 'accept' } });
    expect(screen.getByLabelText('Cost to fix *')).toHaveValue('100000000');
  });
  it('resets entered values after closing before opening a different Risk', () => {
    const props = { riskId: 'risk-1', riskLabel: 'Risk one', onClose: vi.fn() };
    const view = render(<CreateRiskTreatmentPlanDialog {...props} />);
    fireEvent.change(screen.getByLabelText('Plan title'), { target: { value: 'Previous Risk plan' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    view.rerender(<CreateRiskTreatmentPlanDialog {...props} riskId='risk-2' riskLabel='Risk two' />);
    expect(screen.getByLabelText('Plan title')).toHaveValue('');
  });
  it('disables creation for accepted Risk', () => {
    state.status = 'accepted';
    render(<CreateRiskTreatmentPlanDialog riskId='risk' riskLabel='Risk' onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Create plan' })).toBeDisabled();
  });
});
