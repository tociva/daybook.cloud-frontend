import { Component, computed, input, signal } from '@angular/core';
export type SkeletonVariant = 'text' | 'avatar' | 'card' | 'button' | 'image' | 'custom';


@Component({
  selector: 'app-skelton-loader',
  imports: [],
  templateUrl: './skelton-loader.html',
  styleUrl: './skelton-loader.css'
})
export class SkeltonLoader {
  variant = input<SkeletonVariant>('text');
  width = input<string>('100%');
  height = input<string>('auto');
  lines = input<number>(3);
  lastLineWidth = input<boolean>(true);
  showImage = input<boolean>(true);
  rounded = input<boolean>(false);
  shimmer = input<boolean>(false);
  customClass = input<string>('');
  
  ariaLabel = 'Loading content...';
  
  containerClasses = computed(() => {
    const baseClasses = 'bg-gray-200';
    const shimmerClass = this.shimmer() ? 'shimmer' : '';
    const roundedClass = this.rounded() ? 'rounded-lg' : '';
    const customClass = this.customClass();
    
    return `${baseClasses} ${shimmerClass} ${roundedClass} ${customClass}`.trim();
  });
  
  // Utility method for creating arrays in template
  Array = Array;
}
