import { useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useRequestsStore } from '../stores/requests.store';
import { FixtureType, Gender, RequestType } from '../types/enums';
import {
  formatFixtureType,
  formatGender,
  formatHall,
  formatTeam,
  getHallFromTeamNumber,
} from '../utils/formatters';

const REQUEST_TYPE_OPTIONS: { type: RequestType; label: string; icon: string }[] = [
  { type: RequestType.BATHROOM, label: 'Bathroom', icon: '🚻' },
  { type: RequestType.PRAYER, label: 'Prayer', icon: '🕌' },
  { type: RequestType.BREAK_TIME, label: 'Break time', icon: '⏸️' },
];

const GENDER_OPTIONS = Object.values(Gender);
const FIXTURE_TYPE_OPTIONS = Object.values(FixtureType);

export function HomePage() {
  const createRequest = useRequestsStore((s) => s.create);

  const [teamNumber, setTeamNumber] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [fixtureType, setFixtureType] = useState<FixtureType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const parsedTeamNumber = Number(teamNumber);
  const isValidTeamNumber = /^\d{4}$/.test(teamNumber);
  const derivedHall = isValidTeamNumber ? getHallFromTeamNumber(parsedTeamNumber) : null;
  const needsFixtureType = gender === Gender.MALE && requestType === RequestType.BATHROOM;
  const canSubmit =
    Boolean(derivedHall) &&
    Boolean(gender) &&
    Boolean(requestType) &&
    (!needsFixtureType || Boolean(fixtureType)) &&
    isValidTeamNumber &&
    !submitting;

  const handleSubmit = async () => {
    if (!derivedHall || !gender || !requestType || !canSubmit) return;
    setSubmitting(true);
    try {
      const created = await createRequest({
        hall: derivedHall,
        teamNumber: parsedTeamNumber,
        gender,
        requestType,
        fixtureType: needsFixtureType && fixtureType ? fixtureType : undefined,
      });
      toast.success(
        `Request submitted — ${formatTeam(created.hall, created.teamNumber)}. A volunteer will come find you shortly.`,
      );
      setTeamNumber('');
      setGender(null);
      setRequestType(null);
      setFixtureType(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit your request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Need help?</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tell us where you are and what you need — no login required.
        </p>
      </div>

      <Card className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Team number</label>
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="e.g. 2015"
            value={teamNumber}
            onChange={(e) => setTeamNumber(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">
            {derivedHall
              ? `→ ${formatHall(derivedHall)}`
              : teamNumber && !isValidTeamNumber
                ? 'Team number must be 4 digits.'
                : 'Team number should start with your hall number (1-4), e.g. 2015 for Hall 1 & 2.'}
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Gender</label>
          <div className="grid grid-cols-2 gap-2">
            {GENDER_OPTIONS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setGender(g);
                  setFixtureType(null);
                }}
                className={`rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                  gender === g
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {formatGender(g)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">What do you need?</label>
          <div className="grid grid-cols-2 gap-2">
            {REQUEST_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  setRequestType(opt.type);
                  setFixtureType(null);
                }}
                className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                  requestType === opt.type
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-xl">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {needsFixtureType && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Urinal or toilet?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FIXTURE_TYPE_OPTIONS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFixtureType(f)}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                    fixtureType === f
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {formatFixtureType(f)}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button
          size="lg"
          className="w-full"
          disabled={!canSubmit}
          loading={submitting}
          onClick={() => void handleSubmit()}
        >
          Request Help
        </Button>
      </Card>
    </div>
  );
}
