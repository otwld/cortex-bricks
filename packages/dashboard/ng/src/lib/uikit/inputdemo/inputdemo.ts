import { Component, inject, OnInit } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputGroupModule } from 'primeng/inputgroup';
import { FluidModule } from 'primeng/fluid';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FloatLabelModule } from 'primeng/floatlabel';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { InputNumberModule } from 'primeng/inputnumber';
import { SliderModule } from 'primeng/slider';
import { RatingModule } from 'primeng/rating';
import { ColorPickerModule } from 'primeng/colorpicker';
import { KnobModule } from 'primeng/knob';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TreeSelectModule } from 'primeng/treeselect';
import { MultiSelectModule } from 'primeng/multiselect';
import { ListboxModule } from 'primeng/listbox';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { TextareaModule } from 'primeng/textarea';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TreeNode } from 'primeng/api';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputOtpModule } from 'primeng/inputotp';
import { Country, CountryService, NodeService } from '@otwld/ng-dashboard/core';

interface CityOption {
  name: string;
  code: string;
}

interface SelectButtonOption {
  name: string;
}

/**
 * Demonstrates PrimeNG input, selection, toggle, and grouped form controls.
 */
@Component({
  selector: 'app-input-demo',
  imports: [
    FormsModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    RadioButtonModule,
    SelectButtonModule,
    InputGroupModule,
    FluidModule,
    IconFieldModule,
    InputIconModule,
    FloatLabelModule,
    AutoCompleteModule,
    InputNumberModule,
    SliderModule,
    RatingModule,
    ColorPickerModule,
    KnobModule,
    SelectModule,
    DatePickerModule,
    ToggleButtonModule,
    ToggleSwitchModule,
    TreeSelectModule,
    MultiSelectModule,
    ListboxModule,
    InputGroupAddonModule,
    TextareaModule,
    IftaLabelModule,
    InputOtpModule,
  ],
  templateUrl: './inputdemo.html',
  providers: [CountryService, NodeService],
})
export class InputDemo implements OnInit {
  protected floatValue: string | null = null;

  protected iftaValue: string | null = null;

  protected inputOtpValue: string | null = null;

  protected autoValue: Country[] = [];

  protected autoFilteredValue: Country[] = [];

  protected selectedAutoValue: Country | null = null;

  protected calendarValue: Date | null = null;

  protected inputNumberValue: number | null = null;

  protected sliderValue = 50;

  protected ratingValue: number | null = null;

  protected colorValue = '#1976D2';

  protected radioValue: string | null = null;

  protected checkboxValue: string[] = [];

  protected switchValue = false;

  protected readonly listboxValues: CityOption[] = [
    { name: 'New York', code: 'NY' },
    { name: 'Rome', code: 'RM' },
    { name: 'London', code: 'LDN' },
    { name: 'Istanbul', code: 'IST' },
    { name: 'Paris', code: 'PRS' },
  ];

  protected listboxValue: CityOption | null = null;

  protected readonly dropdownValues: CityOption[] = [
    { name: 'New York', code: 'NY' },
    { name: 'Rome', code: 'RM' },
    { name: 'London', code: 'LDN' },
    { name: 'Istanbul', code: 'IST' },
    { name: 'Paris', code: 'PRS' },
  ];

  protected dropdownValue: CityOption | null = null;

  protected readonly multiselectCountries: Country[] = [
    { name: 'Australia', code: 'AU' },
    { name: 'Brazil', code: 'BR' },
    { name: 'China', code: 'CN' },
    { name: 'Egypt', code: 'EG' },
    { name: 'France', code: 'FR' },
    { name: 'Germany', code: 'DE' },
    { name: 'India', code: 'IN' },
    { name: 'Japan', code: 'JP' },
    { name: 'Spain', code: 'ES' },
    { name: 'United States', code: 'US' },
  ];

  protected multiselectSelectedCountries: Country[] = [];

  protected toggleValue = false;

  protected selectButtonValue: SelectButtonOption | null = null;

  protected readonly selectButtonValues: SelectButtonOption[] = [{ name: 'Option 1' }, { name: 'Option 2' }, { name: 'Option 3' }];

  protected knobValue = 50;

  protected inputGroupValue = false;

  protected treeSelectNodes: TreeNode[] = [];

  protected selectedNode: TreeNode | null = null;

  private readonly countryService = inject(CountryService);

  private readonly nodeService = inject(NodeService);

  /**
   * Loads country and tree option data for the PrimeNG controls.
   */
  ngOnInit(): void {
    this.countryService.getCountries().then((countries) => {
      this.autoValue = countries;
    });

    this.nodeService.getFiles().then((data) => (this.treeSelectNodes = data));
  }

  /**
   * Filters autocomplete countries by prefix.
   */
  protected filterCountry(event: AutoCompleteCompleteEvent): void {
    const query = event.query.toLowerCase();

    this.autoFilteredValue = this.autoValue.filter((country) => country.name?.toLowerCase().startsWith(query));
  }
}
