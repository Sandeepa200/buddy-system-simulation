import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  MemoryStick, 
  PlusCircle, 
  Trash2, 
  RefreshCcw 
} from 'lucide-react';

class BuddySystem {
  constructor(totalMemory) {
    this.totalMemory = totalMemory;
    this.freeList = new Map();
    this.allocatedBlocks = new Map();

    // Initialize with entire memory as free
    this.freeList.set(totalMemory, [0]);
  }

  nextPowerOfTwo(size) {
    let power = 1;
    while (power < size) {
      power *= 2;
    }
    return power;
  }

  allocate(size) {
    const blockSize = this.nextPowerOfTwo(size);
    let availableSize = null;
  
    const freeListKeys = Array.from(this.freeList.keys()).sort((a, b) => a - b);
    for (let key of freeListKeys) {
      if (key >= blockSize) {
        availableSize = key;
        break;
      }
    }
  
    if (availableSize === null) return -1;
  
    const freeBlocks = this.freeList.get(availableSize);
    const blockStart = freeBlocks.shift();
    if (freeBlocks.length === 0) {
      this.freeList.delete(availableSize);
    }
  
    while (availableSize > blockSize) {
      availableSize /= 2;
      const buddyStart = blockStart + availableSize;
  
      if (!this.freeList.has(availableSize)) {
        this.freeList.set(availableSize, []);
      }
      this.freeList.get(availableSize).push(buddyStart);
    }
  
    this.allocatedBlocks.set(blockStart, blockSize);
    return blockStart;
  }
  

  deallocate(address) {
    if (!this.allocatedBlocks.has(address)) return false;

    const blockSize = this.allocatedBlocks.get(address);
    this.allocatedBlocks.delete(address);

    this.mergeBuddy(address, blockSize);
    return true;
  }

  mergeBuddy(address, blockSize) {
    while (blockSize < this.totalMemory) {
      const buddyAddress = address ^ blockSize;

      const buddyBlocks = this.freeList.get(blockSize);
      if (buddyBlocks && buddyBlocks.includes(buddyAddress)) {
        const index = buddyBlocks.indexOf(buddyAddress);
        buddyBlocks.splice(index, 1);

        if (buddyBlocks.length === 0) {
          this.freeList.delete(blockSize);
        }

        address = Math.min(address, buddyAddress);
        blockSize *= 2;
      } else {
        break;
      }
    }

    if (!this.freeList.has(blockSize)) {
      this.freeList.set(blockSize, []);
    }
    this.freeList.get(blockSize).push(address);
  }
}

const BuddySystemMemoryAllocator = () => {
  const [totalMemory, setTotalMemory] = useState(128);
  const [buddySystem, setBuddySystem] = useState(null);
  const [allocSize, setAllocSize] = useState('');
  const [deallocAddress, setDeallocAddress] = useState('');
  const [memoryState, setMemoryState] = useState({
    freeList: [],
    allocatedBlocks: []
  });
  const [error, setError] = useState('');

  const initializeBuddySystem = () => {
    try {
      const memory = parseInt(totalMemory);
      if (isNaN(memory) || memory <= 0 || (memory & (memory - 1)) !== 0) {
        setError('Total memory must be a positive power of 2');
        return;
      }
      const newBuddySystem = new BuddySystem(memory);
      setBuddySystem(newBuddySystem);
      updateMemoryState(newBuddySystem);
      setError('');
    } catch (err) {
      setError('Failed to initialize Buddy System');
    }
  };

  const updateMemoryState = (system) => {
    const freeList = Array.from(system.freeList.entries()).map(([size, blocks]) => ({
      size,
      blocks
    }));
    const allocatedBlocks = Array.from(system.allocatedBlocks.entries()).map(([start, size]) => ({
      start,
      size
    }));
    setMemoryState({ freeList, allocatedBlocks });
  };

  const handleAllocate = () => {
    if (!buddySystem) {
      setError('Initialize Buddy System first');
      return;
    }

    const size = parseInt(allocSize);
    if (isNaN(size) || size <= 0) {
      setError('Invalid allocation size');
      return;
    }

    const address = buddySystem.allocate(size);
    if (address === -1) {
      setError('Allocation failed: Not enough memory');
    } else {
      updateMemoryState(buddySystem);
      setError('');
    }
    setAllocSize('');
  };

  const handleDeallocate = () => {
    if (!buddySystem) {
      setError('Initialize Buddy System first');
      return;
    }

    const address = parseInt(deallocAddress);
    if (isNaN(address) || address < 0) {
      setError('Invalid deallocation address');
      return;
    }

    const success = buddySystem.deallocate(address);
    if (!success) {
      setError('Deallocation failed: Invalid address');
    } else {
      updateMemoryState(buddySystem);
      setError('');
    }
    setDeallocAddress('');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MemoryStick className="mr-2" /> Buddy System Memory Allocator
          </CardTitle>
          <CardDescription className="text-right">The values can be any unit KB, MB or GB </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Memory (Power of 2)</Label>
              <div className="flex space-x-2">
                <Input 
                  type="number" 
                  value={totalMemory}
                  onChange={(e) => setTotalMemory(parseInt(e.target.value) || 0)}
                  placeholder="Enter total memory"
                />
                <Button onClick={initializeBuddySystem}>
                  <RefreshCcw className="mr-2" /> Initialize
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Memory Allocation</Label>
              <div className="flex space-x-2">
                <Input 
                  type="number" 
                  value={allocSize}
                  onChange={(e) => setAllocSize(e.target.value)}
                  placeholder="Enter size"
                />
                <Button 
                  onClick={handleAllocate}
                  disabled={!buddySystem || !allocSize}
                >
                  <PlusCircle className="mr-2" /> Allocate
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Memory Deallocation</Label>
              <div className="flex space-x-2">
                <Input 
                  type="number" 
                  value={deallocAddress}
                  onChange={(e) => setDeallocAddress(e.target.value)}
                  placeholder="Enter address"
                />
                <Button 
                  onClick={handleDeallocate}
                  disabled={!buddySystem || !deallocAddress}
                >
                  <Trash2 className="mr-2" /> Deallocate
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center text-red-500">
              <AlertTriangle className="mr-2" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Memory State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Free Blocks</h3>
              {memoryState.freeList.length === 0 ? (
                <p className="text-gray-500">No free blocks</p>
              ) : (
                <ul className="space-y-1">
                  {memoryState.freeList.map(({size, blocks}, index) => (
                    <li key={index} className="bg-green-100 p-2 rounded">
                      Size: {size}, Block start address: {blocks.join(', ')}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Allocated Blocks</h3>
              {memoryState.allocatedBlocks.length === 0 ? (
                <p className="text-gray-500">No allocated blocks</p>
              ) : (
                <ul className="space-y-1">
                  {memoryState.allocatedBlocks.map(({start, size}, index) => (
                    <li key={index} className="bg-blue-100 p-2 rounded">
                      Start address: {start}, Size: {size}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuddySystemMemoryAllocator;
