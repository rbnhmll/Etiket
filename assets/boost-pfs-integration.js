/** Please don't modify or unzip this content. It will be updated regularly **/
    (function() {
      BoostPFS.inject(this);

      //Set global variable
      Globals.hasIntegration = true;
      // 3rd app compile template
      Integration.compileIntegrationTemplate = function (data, itemHtml) {
        var itemReviewsHtml = '<span class="shopify-product-reviews-badge" data-id="' + data.id + '"></span>';itemHtml = itemHtml.replace(/{{itemReviews}}/g, itemReviewsHtml);
        return itemHtml;
      };

      Integration.call3rdIntegrationFunc = function(data) {
        if (window.SPR) {  window.SPR.initDomEls();  window.SPR.loadBadges();}
      }

    })();