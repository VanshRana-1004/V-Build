'use client'
import { useState,useRef, useCallback, useEffect } from "react";
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ options , initialValue, onChange } : { options : { value: string, label: string }[], initialValue : string, onChange : (value : string)=>void}){
  const [selected, setSelected] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const handleSelect = useCallback((value : string) => {
    setSelected(value);
    setIsOpen(false);
    onChange(value);
  }, [onChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !(selectRef.current as HTMLElement).contains(event.target as HTMLElement)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedLabel = options.find(opt => opt.value === selected)?.label || initialValue;

  return (
    <div className="relative w-auto font-sans " ref={selectRef}>

      <button
        type="button"
        className="
          flex justify-between items-center  
          bg-zinc-800/30 text-white/80 text-sm poppins-regular border border-zinc-700/50 
          rounded-lg w-56 px-7 py-1.5 transition-all duration-150
          focus:outline-none focus:ring-0 cursor-pointer
        "
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown 
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="
            absolute z-50 top-0 -translate-y-52 w-56 max-h-60 overflow-y-auto 
            bg-zinc-900 rounded-lg border border-zinc-700/50 p-1
          "
        >
          {options.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === selected}
              onClick={() => handleSelect(option.value)}
              className={`
                cursor-pointer text-white flex justify-between items-center transition-colors w-full
                px-7 py-1.5 rounded-lg hover:bg-zinc-800/50 text-sm
              `}
            >
              <span>{option.label}</span>
              {option.value === selected && (
                <Check className="w-4 h-4 text-zinc-400" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};