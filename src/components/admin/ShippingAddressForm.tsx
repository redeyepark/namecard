'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ShippingAddress } from '@/types/print-order';

const STORAGE_KEY = 'print-shipping-address';

const EMPTY_ADDRESS: ShippingAddress = {
  firstName: '',
  lastName: '',
  companyName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postCode: '',
  country: 'KR',
  email: '',
  phone: '',
};

interface ShippingAddressFormProps {
  onSubmit: (address: ShippingAddress) => void;
  onBack?: () => void;
  disabled?: boolean;
}

/**
 * Shipping address form with localStorage persistence.
 * Validates required fields and saves/loads from localStorage.
 */
export function ShippingAddressForm({ onSubmit, onBack, disabled }: ShippingAddressFormProps) {
  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load saved address from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ShippingAddress;
        setAddress({ ...EMPTY_ADDRESS, ...parsed });
      }
    } catch {
      // Ignore parse errors, use default
    }
  }, []);

  const handleChange = useCallback((field: keyof ShippingAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const required: Array<{ field: keyof ShippingAddress; label: string }> = [
      { field: 'lastName', label: '성' },
      { field: 'firstName', label: '이름' },
      { field: 'addressLine1', label: '주소1' },
      { field: 'city', label: '시/군/구' },
      { field: 'postCode', label: '우편번호' },
      { field: 'country', label: '국가' },
      { field: 'email', label: '이메일' },
      { field: 'phone', label: '전화번호' },
    ];

    const newErrors: Record<string, string> = {};
    for (const { field, label } of required) {
      if (!address[field] || address[field].trim() === '') {
        newErrors[field] = `${label}은(는) 필수입니다`;
      }
    }

    // Email format validation
    if (address.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
      newErrors.email = '올바른 이메일 형식을 입력하세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [address]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(address));
    } catch {
      // Ignore storage errors
    }

    onSubmit(address);
  }, [address, validate, onSubmit]);

  const renderField = (
    field: keyof ShippingAddress,
    label: string,
    options?: { type?: string; placeholder?: string; required?: boolean; half?: boolean }
  ) => {
    const { type = 'text', placeholder, required = true, half = false } = options ?? {};
    return (
      <div className={half ? 'flex-1' : 'w-full'}>
        <label className="block text-xs font-medium text-[#020912]/60 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
          type={type}
          value={address[field] ?? ''}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full text-sm border rounded px-3 py-2 text-[#020912] placeholder:text-[#020912]/30 focus:outline-none focus:border-[#020912]/40 disabled:bg-gray-50 disabled:text-gray-400 ${
            errors[field] ? 'border-red-400' : 'border-[rgba(2,9,18,0.15)]'
          }`}
          aria-label={label}
          aria-invalid={!!errors[field]}
        />
        {errors[field] && (
          <p className="text-xs text-red-500 mt-0.5">{errors[field]}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-[#020912] mb-3">
        배송 주소
      </h3>

      <div className="flex gap-3">
        {renderField('lastName', '성', { placeholder: '홍', half: true })}
        {renderField('firstName', '이름', { placeholder: '길동', half: true })}
      </div>

      {renderField('companyName', '회사명', { required: false, placeholder: '(선택)' })}

      {renderField('addressLine1', '주소1', { placeholder: '도로명 주소' })}
      {renderField('addressLine2', '주소2', { required: false, placeholder: '상세 주소 (선택)' })}

      <div className="flex gap-3">
        {renderField('city', '시/군/구', { placeholder: '서울시', half: true })}
        {renderField('state', '도/광역시', { required: false, placeholder: '(선택)', half: true })}
      </div>

      <div className="flex gap-3">
        {renderField('postCode', '우편번호', { placeholder: '12345', half: true })}
        {renderField('country', '국가', { placeholder: 'KR', half: true })}
      </div>

      <div className="flex gap-3">
        {renderField('email', '이메일', { type: 'email', placeholder: 'email@example.com', half: true })}
        {renderField('phone', '전화번호', { type: 'tel', placeholder: '010-1234-5678', half: true })}
      </div>

      <div className="flex gap-3 pt-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={disabled}
            className="flex-1 py-2.5 text-sm font-medium text-[#020912] bg-white border border-[rgba(2,9,18,0.15)] rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            이전
          </button>
        )}
        <button
          type="submit"
          disabled={disabled}
          className="flex-1 py-2.5 text-sm font-medium text-white bg-[#020912] rounded hover:bg-[#020912]/90 transition-colors disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </form>
  );
}
