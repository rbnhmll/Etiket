
// Override Settings
var boostPFSFilterConfig = {
  general: {
    limit: boostPFSThemeConfig.custom.products_per_page,
    /* Optional */
    loadProductFirst: false,
    filterTreeMobileStyle: 'style3',
    enableOTP:true,
  },
};

(function() {
  var onSale = false,
      soldOut = false,
      priceVaries = false,
      images = [],
      firstVariant = {},
      boostPFSImgDefaultSrc = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
      boostPFSRangeWidths = [180, 360, 540, 720, 900, 1080, 1296, 1512, 1728, 2048];


  BoostPFS.inject(this);
  var colorVariantName = Settings.getSettingValue('custom.color_variant_name');
  if (colorVariantName) boostPFSFilterConfig.general.colorVariantNames.push(colorVariantName);

  /************************** CUSTOMIZE DATA BEFORE BUILDING PRODUCT ITEM **************************/
  function prepareShopifyData(data) {
    // Displaying price base on the policy of Shopify, have to multiple by 100
    soldOut = !data.available; // Check a product is out of stock
    onSale = data.compare_at_price_max > data.price_max; // Check a product is on sale
    priceVaries = data.price_min != data.price_max; // Check a product has many prices
    // Convert images to array
    images = data.images_info;
    // Get First Variant (selected_or_first_available_variant)
    firstVariant = data['variants'][0];
    if (Utils.getParam('variant') !== null && Utils.getParam('variant') != '') {
      var paramVariant = data.variants.filter(function(e) {
        return e.id == Utils.getParam('variant');
      });
      if (typeof paramVariant[0] !== 'undefined') firstVariant = paramVariant[0];
    } else {
      for (var i = 0; i < data['variants'].length; i++) {
        if (data['variants'][i].available) {
          firstVariant = data['variants'][i];
          break;
        }
      }
    }
    return data;
  }

  /************************** END CUSTOMIZE DATA BEFORE BUILDING PRODUCT ITEM **************************/
  /************************** BUILD PRODUCT LIST **************************/
  // Build Product Grid Item
  ProductGridItem.prototype.compileTemplate = function(data) {
    if (!data) data = this.data;
    // Customize API data to get the Shopify data
    data = prepareShopifyData(data);

    // Get Template
    var itemHtml = boostPFSTemplate.productGridItemHtml;


    // Add Review
    if (typeof Integration === 'undefined' ||
        (typeof Integration != 'undefined' &&
         typeof Integration.hascompileTemplate == 'function' &&
         !Integration.hascompileTemplate('reviews'))) {
      itemHtml = itemHtml.replace(/{{itemReviews}}/g, '');
    }

    // Add Actions
    itemHtml = itemHtml.replace(/{{itemActions}}/g, buildActions(data));

    // Add Labels
    itemHtml = itemHtml.replace(/{{itemLabels}}/g, buildLabels(data));

    // Add TAG Label
    itemHtml = itemHtml.replace(/{{itemTagLabels}}/g, buildTagLabels(data, false));
    
    // Add Images
    itemHtml = itemHtml.replace(/{{itemImages}}/g, buildImages(data));

    // Add Swatches
    itemHtml = itemHtml.replace(/{{itemSwatches}}/g, buildSwatches(data));      

    // Add Vendor
    itemHtml = itemHtml.replace(/{{itemVendor}}/g, buildVendor(data));

    // Add Price
    itemHtml = itemHtml.replace(/{{itemPrice}}/g, buildPrice(data));


    // Add main attribute (Always put at the end of this function)
    itemHtml = itemHtml.replace(/{{itemId}}/g, data.id);
    itemHtml = itemHtml.replace(/{{variantId}}/g, firstVariant.id);      
    itemHtml = itemHtml.replace(/{{itemTitle}}/g, data.title);
    itemHtml = itemHtml.replace(/{{itemHandle}}/g, data.handle);
    itemHtml = itemHtml.replace(/{{itemVendorLabel}}/g, data.vendor);
    itemHtml = itemHtml.replace(/{{itemUrl}}/g, Utils.buildProductItemUrl(data));
    return itemHtml;
  };


  /************************** END BUILD PRODUCT LIST **************************/
  /************************** BUILD PRODUCT ITEM ELEMENTS **************************/

  function buildActions(data) {
    if (!Settings.getSettingValue('custom.quick_add_enable') && !Settings.getSettingValue('custom.quick_shop_enable')) return ''

    var html = '<div class="grid-product__actions">';

    if (Settings.getSettingValue('custom.quick_shop_enable')) {
      html += '<button class="btn btn--circle btn--icon quick-product__btn quick-product__btn--not-ready js-modal-open-quick-modal-{{itemId}} small--hide" title="' + Labels.quick_shop + '" tabindex="-1" data-handle="{{itemHandle}} ">';
      html += '	<svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-search" viewBox="0 0 64 64"><defs><style>.cls-1{fill:none;stroke:#000;stroke-miterlimit:10;stroke-width:2px}</style></defs><path class="cls-1" d="M47.16 28.58A18.58 18.58 0 1 1 28.58 10a18.58 18.58 0 0 1 18.58 18.58zM54 54L41.94 42"/></svg>';
      html += '	<span class="icon__fallback-text">' + Labels.quick_shop + '</span>';
      html += '</button>';
    }

    if (Settings.getSettingValue('custom.quick_add_enable') && data.available) {
      if (data.variants.length === 1) {
        html += '<button type="button" class="text-link quick-add-btn js-quick-add-btn"	title="' + Labels.add_to_cart + '" tabindex="-1" data-id="{{variantId}}">';
        html += '	<span class="btn btn--circle btn--icon">';
        html += ' <svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-plus" viewBox="0 0 64 64"><path class="cls-1" d="M32 9v46m23-23H9"/></svg>';
        html += ' <span class="icon__fallback-text">' + Labels.add_to_cart + '</span>';
        html += ' </span>';
        html += '</button>';
      } else {
        html += '<button type="button" class="text-link quick-add-btn js-quick-add-form js-modal-open-quick-add" title="' + Labels.add_to_cart + '" tabindex="-1">';
        html += '	<span class="btn btn--circle btn--icon">';
        html += '	<svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-plus" viewBox="0 0 64 64"><path class="cls-1" d="M32 9v46m23-23H9"/></svg>';
        html += '	<span class="icon__fallback-text">' + Labels.add_to_cart +'</span>';
        html += '	</span>';
        html += '</button>';
      }
    }

    html += '</div>';

    return html;
  }

  function buildLabels(data) {
    var tags = data.tags.filter(function(tag) { return tag.indexOf('_label_') === 0; });
    var tagsHtml = tags.map(function(tag) { 
      var value = tag.replace('_label_', '');

      return '<div class="grid-product__tag grid-product__tag--custom">' +
        value +
        '</div>';
    }).join(' ');

    if (!data.available) {
      tagsHtml += '<div class="grid-product__tag grid-product__tag--sold-out">' + Labels.sold_out + '</div>'
    } else if (onSale) {
      tagsHtml += '<div class="grid-product__tag grid-product__tag--sale">' + Labels.sale + '</div>'
    }

    return tagsHtml;
  }

  // BUILD LABEL PRODUCT WITH TAGS
function buildTagLabels(data, showall) {
  // if (boostPFSThemeConfig.custom.tag_label_enable) {
    if (showall) {
      var tagLabel = '';
      if (data.tags) {
        for (var i = 0; i < data.tags.length; i++) {
          var tag = data.tags[i];
          if (tag.indexOf("pfs:label") !== -1) {
            var preTagLabel = boostPFSTemplate.tagLabelHtml.replace(/{{labelTag}}/g, tag.split('pfs:label-')[1]);
            tagLabel += preTagLabel;
          }
        }
      }
    } else {
      var tagLabel = '';
      if (data.tags) {
        for (var i = data.tags.length - 1; i >= 0; i--) {
          tag = data.tags[i];
          if (tag.indexOf("pfs:label") !== -1) {
            var preTagLabel = boostPFSTemplate.tagLabelHtml.replace(/{{labelTag}}/g, tag.split('pfs:label-')[1]);
            tagLabel += preTagLabel;
            break;
          }
        }
      }
    }
    return tagLabel;
  // } else {
  //   return "";
  // }
}

  function buildImages(data) {
    var fixedAspectRatio = Settings.getSettingValue('custom.product_grid_image_size') !== 'natural';
    var imageFill = Settings.getSettingValue('custom.product_grid_image_fill');
    var imageSize = Settings.getSettingValue('custom.product_grid_image_size');
    var aspectRatio = images.length > 0 ? images[0]['width'] / images[0]['height'] : '';
    var paddingBottom = images.length > 0 ? 100 / aspectRatio : '100';
    var imgAlt = images.length > 0 && images[0].alt ? images[0].alt : '{{itemTitle}}';      

    var html = '';
    if (fixedAspectRatio) {
      html = '<div class="grid__image-ratio grid__image-ratio--{{imgSize}}">';
      html += '	<img class="lazyload{{imgFill}}"';        
    } else {
      html = '<div  style="height: 0; padding-bottom: {{paddingBottom}}%;">';
      html += '	<img class="grid-product__image lazyload"';
    }
    html += '		data-src="{{imgUrl}}"';
    html += '		data-widths="[160, 200, 280, 360, 540, 720, 900]"';
    html += '		data-aspectratio="{{aspectRatio}}"';
    html += '		data-sizes="auto"';
    html += '		alt="{{imgAlt}}">';
    html += '	<noscript>';
    html += '		<img class="grid-product__image lazyloaded"';
    html += '			src="{{imgUrl400}}"';
    html += '			alt="{{imgAlt}}">';
    html += '	</noscript>';
    html += '</div>';   

    html = html.replace(/{{imgSize}}/g, imageSize);
    html = html.replace(/{{imgFill}}/g, !imageFill ? ' grid__image-contain' : '');      
    html = html.replace(/{{paddingBottom}}/g, paddingBottom);            
    html = html.replace(/{{imgUrl}}/g, Utils.getFeaturedImage(images, '{width}x'));                  
    html = html.replace(/{{aspectRatio}}/g, aspectRatio); 
    html = html.replace(/{{imgAlt}}/g, imgAlt);       
    html = html.replace(/{{imgUrl400}}/g, Utils.getFeaturedImage(images, '400x'));             

    if (Settings.getSettingValue('custom.product_hover_image') && images.length > 1) {
      aspectRatio = images[1]['width'] / images[0]['height'];
      imgAlt = images[1].alt ? images[1].alt : '{{itemTitle}}';          

      html += '<div class="grid-product__secondary-image small--hide">';
      html += '	<img class="lazyload"';
      html += '    	data-src="{{imgUrl}}"';
      html += '        data-widths="[360, 540, 720, 1000]"';
      html += '        data-aspectratio="{{aspectRatio}}"';
      html += '        data-sizes="auto"';
      html += '        alt="{{imgAlt}}">';
      html += '</div>';

      html = html.replace(/{{imgUrl}}/g, Utils.optimizeImage(images[1].src, '{width}x')); 
      html = html.replace(/{{aspectRatio}}/g, aspectRatio);         
      html = html.replace(/{{imgAlt}}/g, imgAlt); 
    }

    if (Settings.getSettingValue('custom.enable_swatches')) {
      var colorIndex = data.options_with_values.findIndex(function(opt) { return boostPFSFilterConfig.general.colorVariantNames.indexOf(opt.name) > -1; });
      if (colorIndex > -1) {
        var colors = [];

        for (var variant of data.variants) {
          if (!variant.image) continue;

          var color = variant['option' + (colorIndex + 1)];
          if (colors.indexOf(color) > -1) continue;
          colors.push(color);


          html += '<div class="grid-product__color-image grid-product__color-image--'+ variant.id + '"></div>';
        }
      }
    }

    return html;
  }

  function buildSwatches(data) {
    if (!Settings.getSettingValue('custom.enable_swatches')) return ''
    var colorVariantName = Settings.getSettingValue('custom.color_variant_name');
    var swatchFileExtension = 'png';
    var colorCount = 0;
    var maxColorsShow = 4;
    var moreThanMax = false;

    var html = '';

    var colorIndex = data.options_with_values.findIndex(function(opt) { return boostPFSFilterConfig.general.colorVariantNames.indexOf(opt.name) > -1; });
    if (colorIndex === -1) return ''

    var colors = [];

    html = '<div class="grid-product__colors">';

    for (var variant of data.variants) {
      var color = variant['option' + (colorIndex + 1)];
      if (colors.indexOf(color) > -1) continue;

      colors.push(color);
      colorCount++;

      if (colorCount > maxColorsShow) break;

      var value = Utils.slugify(color);
      var colorFallback = color.toLowerCase();
      var colorImage =  Utils.optimizeImage(variant.image, '40x');

      if (colorFallback.indexOf(' ') > -1) {
        var tmp = colorFallback.split(' ');
        colorFallback = tmp[tmp.length - 1];          
      }

      html += '<span class="color-swatch color-swatch--small color-swatch--' + value + (variant.image ? ' color-swatch--with-image' : '') + '"';
      html += '      data-url="{{itemUrl}}?variant=' + variant.id + '"';
      if (variant.image) {
        html += '    data-variant-id="' + variant.id + '"';
        html += '    data-variant-image="' + Utils.optimizeImage(variant.image, '400x') + '"';          
      }
      html += '      style="background-color: ' + colorFallback + '; background-image: url(' + colorImage + ');">';
      html += '   <span class="visually-hidden">' + color + '</span>';
      html += '</span>'
    }

    if (colorCount > maxColorsShow) {
      var left = data.options_with_values[colorIndex].values.length - colorCount - 1;
      html += '<small class="color-swatch__more">+' + left + '</small>';
    }

    html += '</div>';

    return html;
  }

  function buildVendor(data) {
    if (!Settings.getSettingValue('custom.vendor_enable')) return ''

    return boostPFSTemplate.vendorHtml;
  }

  function buildPrice(data) {
    //var price = Utils.formatMoney(data.price_max) || Utils.formatMoney(data.price_min);
    var price = Utils.formatMoney(data.price_max);
    var formattedPrice = formatPrice(price);
    var comparePrice = Utils.formatMoney(data.compare_at_price_max);
    var formattedComparePrice = formatPrice(comparePrice);
   
    var html = ' <div class="grid-product__price">';
 
    if (priceVaries) {
      html += '<span class="grid-product__price--current">';
      // html += '   <span aria-hidden="true" class="grid-product__price--from">' + Labels.from.replace('{{ price }}', formattedPrice) + '</span>';
      html += '   <span aria-hidden="true" class="grid-product__price--from">' + price + '</span>';
      html += '   <span class="visually-hidden">' + Labels.from.replace('{{ price }}', price) + '</span>';
      html += '</span>';
    } else {
      if (onSale) {
        html += '<span class="visually-hidden">' + Labels.sale_price + '</span>'
      }
      html += '<span class="grid-product__price--current">';
      html += '<span aria-hidden="true">' +  formattedPrice + '</span>';
      html += '<span class="visually-hidden">' + price + '</span>';          
      html += '</span>';
    }

    if (onSale) {
      html += '<span class="visually-hidden">' + Labels.regular_price + '</span>';
      html += '<span class="grid-product__price--original">';         
      html += '<span aria-hidden="true">' +  formattedComparePrice + '</span>';
      html += '<span class="visually-hidden">' + comparePrice + '</span>';             
      html += '</span>';


      if (Settings.getSettingValue('custom.product_save_amount')) {
        var savedAmount = ''
   
        if (Settings.getSettingValue('custom.product_save_type') === 'dollar') {
          savedAmount = Utils.formatMoney(data.compare_at_price_max - data.price_max, Globals.money_format, true);           
        } else {
          savedAmount = data.percent_sale_min + '%';
        }

        html += '<span class="grid-product__price--savings">';
        html += Labels.save_html.replace('{{ saved_amount }}', savedAmount);
        html += '</span>';
      }
    }

    html += '</div>';

    return html;
  }

  function formatPrice(price) {
    if (!Settings.getSettingValue('custom.superscript_decimals')) return price

    if (Globals.moneyFormat.indexOf('{{amount}}') > -1 || Globals.moneyFormat.indexOf('{{ amount }}') > -1) {
      price = price.replace('.', '<sup>') + '<sup>';
    } else if (Globals.moneyFormat.indexOf('{{amount_with_comma_separator}}') > -1 || Globals.moneyFormat.indexOf('{{ amount_with_comma_separator }}') > -1) {
      price = price.replace(',', '<sup>') + '<sup>';        
    }

    return price;
  }

  /************************** END BUILD PRODUCT ITEM ELEMENTS **************************/
  /************************** BUILD TOOLBAR **************************/
  // Build Pagination
  ProductPaginationDefault.prototype.compileTemplate = function(totalProduct) {
    if (!totalProduct) totalProduct = this.totalProduct;
    // Get page info
    var currentPage = parseInt(Globals.queryParams.page);
    var totalPage = Math.ceil(totalProduct / Globals.queryParams.limit);
    // If it has only one page, clear Pagination
    if (totalPage <= 1) {
      return '';
    }

    var paginationHtml = boostPFSTemplate.paginateHtml;
    // Build Previous
    var previousHtml = (currentPage > 1) ? boostPFSTemplate.previousActiveHtml : boostPFSTemplate.previousDisabledHtml;
    previousHtml = previousHtml.replace(/{{itemUrl}}/g, Utils.buildToolbarLink('page', currentPage, currentPage - 1));
    paginationHtml = paginationHtml.replace(/{{previous}}/g, previousHtml);
    // Build Next
    var nextHtml = (currentPage < totalPage) ? boostPFSTemplate.nextActiveHtml : boostPFSTemplate.nextDisabledHtml;
    nextHtml = nextHtml.replace(/{{itemUrl}}/g, Utils.buildToolbarLink('page', currentPage, currentPage + 1));
    paginationHtml = paginationHtml.replace(/{{next}}/g, nextHtml);
    // Create page items array
    var beforeCurrentPageArr = [];
    for (var iBefore = currentPage - 1; iBefore > currentPage - 3 && iBefore > 0; iBefore--) {
      beforeCurrentPageArr.unshift(iBefore);
    }
    if (currentPage - 4 > 0) {
      beforeCurrentPageArr.unshift('...');
    }
    if (currentPage - 4 >= 0) {
      beforeCurrentPageArr.unshift(1);
    }
    beforeCurrentPageArr.push(currentPage);
    var afterCurrentPageArr = [];
    for (var iAfter = currentPage + 1; iAfter < currentPage + 3 && iAfter <= totalPage; iAfter++) {
      afterCurrentPageArr.push(iAfter);
    }
    if (currentPage + 3 < totalPage) {
      afterCurrentPageArr.push('...');
    }
    if (currentPage + 3 <= totalPage) {
      afterCurrentPageArr.push(totalPage);
    }
    // Build page items
    var pageItemsHtml = '';
    var pageArr = beforeCurrentPageArr.concat(afterCurrentPageArr);
    for (var iPage = 0; iPage < pageArr.length; iPage++) {
      if (pageArr[iPage] == '...') {
        pageItemsHtml += boostPFSTemplate.pageItemRemainHtml;
      } else {
        pageItemsHtml += (pageArr[iPage] == currentPage) ? boostPFSTemplate.pageItemSelectedHtml : boostPFSTemplate.pageItemHtml;
      }
      pageItemsHtml = pageItemsHtml.replace(/{{itemTitle}}/g, pageArr[iPage]);
      pageItemsHtml = pageItemsHtml.replace(/{{itemUrl}}/g, Utils.buildToolbarLink('page', currentPage, pageArr[iPage]));
    }
    paginationHtml = paginationHtml.replace(/{{pageItems}}/g, pageItemsHtml);
    return paginationHtml;
  };

  // Build Sorting
  ProductSorting.prototype.compileTemplate = function() {
    var html = '';
    if (boostPFSTemplate.hasOwnProperty('sortingHtml')) {
      var sortingArr = Utils.getSortingList();
      if (sortingArr) {        
        // Build content
        if (Utils.isMobile()) {
          var sortingItemsHtml = '';
          var active = '';
          for (var k in sortingArr) {
            active = '';
            if (k === Globals.queryParams.sort) active = 'selected';

            var itemHtml= boostPFSTemplate.sortingMobileItemHtml;
            itemHtml = itemHtml.replace(/{{active}}/g, active);
            itemHtml = itemHtml.replace(/{{sort}}/g, k);                        
            itemHtml = itemHtml.replace(/{{label}}/g, sortingArr[k]);           

            sortingItemsHtml += itemHtml;
          }
          html = boostPFSTemplate.sortingMobileHtml.replace(/{{sortingItems}}/g, sortingItemsHtml);
        } else {
          var sortingItemsHtml = '';
          for (var k in sortingArr) {
            sortingItemsHtml += '<option value="' + k + '">' + sortingArr[k] + '</option>';
          }
          html = boostPFSTemplate.sortingHtml.replace(/{{sortingItems}}/g, sortingItemsHtml);
        }
      }
    }
    console.log(sortingArr);
    return html;
  };

  ProductSorting.prototype.render = function() {
    if (Utils.isMobile()) jQ('.boost-pfs-filter-tree ' + Selector.topSorting).replaceWith(this.compileTemplate());
    else jQ(Selector.topSorting).html(this.compileTemplate());
    var $selectInput = jQ(Selector.topSorting + ' select');
    if ($selectInput.length) {
      $selectInput.val(Globals.queryParams.sort);
    }
  }

  // Build Sorting event
  ProductSorting.prototype.bindEvents = function() {
    jQ(Selector.topSorting + ' select').change(function(event) {
      // Append "sort" param to url
      // Used to Scroll to the previous position after returning from Product page
      FilterApi.setParam('sort', jQ(this).val());
      FilterApi.setParam('page', 1);
      FilterApi.applyFilter('sort');
    })

    jQ(Selector.topSorting + ' [data-sort]').on('click', function(event) {
      // Append "sort" param to url
      // Used to Scroll to the previous position after returning from Product page
      FilterApi.setParam('sort', jQ(this).data('sort'));
      FilterApi.setParam('page', 1);
      FilterApi.applyFilter('sort');
    })

    jQ(Selector.topSorting + ' .boost-pfs-filter-option-title-heading').on('click', function(event) {
      jQ(this).parents(Selector.topSorting).toggleClass('boost-pfs-filter-option-collapsed');
    });
  };

  /************************** END BUILD TOOLBAR **************************/

  // Add additional feature for product list, used commonly in customizing product list
  ProductList.prototype.afterRender = function(data) {
    if (!data) data = this.data;

    // Intergrate Review Shopify
    if (window.SPR &&
        typeof window.SPR.initDomEls == 'function' &&
        typeof window.SPR.loadBadges == 'function' &&
        boostPFSThemeConfig.custom.show_product_review) {
      window.SPR.initDomEls();
      window.SPR.loadBadges();
    }


    if (Settings.getSettingValue('custom.quick_shop_enable')) {
      var count = 0;

      // Call function to get extra product html by ajax
      this.buildExtrasProductListByAjax(data, 'boost-quickshop', function(results){
        results.forEach(function(result){
          // Append the custom html to product item
          jQ('.boost-custom-modal[data-product-id="'+ result.id + '"]').empty().html(result.quickshop);
          jQ('.grid-product[data-product-id="'+ result.id + '"] .quick-product__btn').removeClass('quick-product__btn--not-ready');
        });

        count += results.length;

        if (count === data.length) buildTheme();
      });
    } else {    
      buildTheme();
    }
    
  };

  // Build additional elements
  Filter.prototype.afterRender = function(data) {
    if (!data) data = this.data;

    var totalProduct = data.total_product + '<span> ' + boostPFSThemeConfig.label.items_with_count_other + '</span>';
    if (data.total_product == 1) {
      totalProduct = data.total_product + '<span> ' + boostPFSThemeConfig.label.items_with_count_one + '</span>';
    }
    jQ('.boost-pfs-filter-total-product').html(totalProduct);

    jQ('body').find('.boost-pfs-filter-skeleton-button').remove();

    // Prevent double tap on iOS
    var isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isiOS) {
      Utils.isMobile() && jQ(".boost-pfs-filter-product-item").find("a").on("touchstart", function() {
        isScrolling = !1
      }).on("touchmove", function() {
        isScrolling = !0
      }).on("touchend", function() {
        isScrolling || (window.location = jQ(this).attr("href"))
      });
    }
    
    buildTheme();

  };



  /* Prevent conflict with theme vendor js */
  Array.prototype.insert = function(a, b) {}	


  function buildTheme() {
    theme.sections.register('collection-template', theme.Collection);

    theme.initGlobals();
    theme.rteInit();    

    if (Utils.isSearchPage()) {
      var searchGrid = document.querySelector('.search-grid');
      if (searchGrid) {
        var searchProducts = searchGrid.querySelectorAll('.grid-product');
        if (searchProducts.length) {
          new theme.QuickAdd(searchGrid);
          new theme.QuickShop(searchGrid);
        }
      }        
    }
  }

  FilterMobileButton.prototype.afterRender = function() {
    var self = this;

    jQ('.collection-filter__btn').off('click').click(function(e) {
      e.preventDefault();
      e.stopPropagation();

      self.onClick.call(self);
      setTimeout(function() {
        jQ('.collection-filter__btn').removeClass('is-active');
        jQ('html').removeClass('lock-scroll');
      }, 100);
    });
  }

  FilterTree.prototype.afterRender = function() {
    if (Utils.isMobile() && this.$element.find(Selector.topSorting).length === 0) {
      this.$element.find('.boost-pfs-filter-options-wrapper').prepend('<div class="boost-pfs-filter-top-sorting"></div>');

      // Add Sorting component
      this.sorting = new ProductSorting();
      this.addComponent(this.sorting);

      var sorting = this.sorting;

      setTimeout(function() { sorting.refresh(); }, 100);

    }
  }
  
  ProductPaginationDefault.prototype._onClickEvent = function (event) {
		event.preventDefault();
		Globals.internalClick = true;

		// Get the new page value
		var url;
		try {
			url = new URL(jQ(event.currentTarget).attr('href'));
		} catch (e) {
			url = new URL('https://' + boostPFSConfig.shop.domain + jQ(event.currentTarget).attr('href'));
		}

		var pageValue = url && url.searchParams ? url.searchParams.get('page') : 1;
		if (!pageValue || isNaN(pageValue)) pageValue = 1;

		// Apply filter
		FilterApi.setParam('page', pageValue);
		FilterApi.applyFilter('page');

		// Scroll to top of product list
		window.scrollTo({
			top: this.$productList.offset().top - 200,
			behavior: 'smooth'
		});
	}

})();