import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '../common/Button';
import apiClient from '../../services/apiClient';

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddDomainModal: React.FC<AddDomainModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await apiClient.post('/domains', { domain });
      setDomain('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || 'Failed to add domain');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-surface border border-white/10 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white mb-2">
                  Track new domain
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-zinc-400">
                    Enter the domain you want to monitor (e.g., example.com).
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20">
                      {error}
                    </div>
                  )}
                  <div>
                    <input
                      type="text"
                      className="w-full rounded-lg border-white/10 bg-background text-white focus:border-ember-500 focus:ring-ember-500 px-3 py-2"
                      placeholder="mycompany.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                    />
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                      Add Domain
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
