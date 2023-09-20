/* global $, afterEach, beforeEach, browser, describe, it */
const expect = require('chai').expect
const { browserName, browserVersion } = browser.capabilities
const isIE = browserName === 'internet explorer'
const liveRegionWaitTimeMillis = 10000

const basicExample = async () => {
  describe('basic example', function () {
    const input = 'input#autocomplete-default'
    const menu = `${input} + ul`
    const firstOption = `${menu} > li:first-child`
    const secondOption = `${menu} > li:nth-child(2)`

    it('should show the input', async () => {
      await $(input).waitForExist()
      await expect(await $(input).isDisplayed()).to.equal(true)
    })

    it('should allow focusing the input', async () => {
      await $(input).click()
      await expect(await $(input).isFocused()).to.equal(true)
    })

    it('should display suggestions', async () => {
      await $(input).click()
      await $(input).setValue('ita')
      await $(menu).waitForDisplayed()
      await expect(await $(menu).isDisplayed()).to.equal(true)
    })

    it('should announce status changes using two alternately updated aria live regions', async () => {
      const regionA = $('#autocomplete-default__status--A')
      const regionB = $('#autocomplete-default__status--B')

      await expect(await regionA.getText()).to.equal('')
      await expect(await regionB.getText()).to.equal('')

      await $(input).click()
      await $(input).setValue('a')

      // We can't tell which region will be used first, so we have to allow for
      // either region changing
      await browser.waitUntil(async () => { return (await regionA.getText()) !== '' || (await regionB.getText()) !== ''; },
        liveRegionWaitTimeMillis,
        'expected the first aria live region to be populated within ' + liveRegionWaitTimeMillis + ' milliseconds'
      )

      if (await regionA.getText()) {
        await $(input).addValue('s')
        await browser.waitUntil(async () => { return ((await regionA.getText()) === '' && (await regionB.getText()) !== ''); },
          liveRegionWaitTimeMillis,
          'expected the first aria live region to be cleared, and the second to be populated within ' +
          liveRegionWaitTimeMillis + ' milliseconds'
        )

        await $(input).addValue('h')
        await browser.waitUntil(async () => { return ((await regionA.getText()) !== '' && (await regionB.getText()) === ''); },
          liveRegionWaitTimeMillis,
          'expected the first aria live region to be populated, and the second to be cleared within ' +
          liveRegionWaitTimeMillis + ' milliseconds'
        )
      } else {
        await $(input).addValue('s')
        await browser.waitUntil(async () => { return ((await regionA.getText()) !== '' && (await regionB.getText()) === ''); },
          liveRegionWaitTimeMillis,
          'expected the first aria live region to be populated, and the second to be cleared within ' +
          liveRegionWaitTimeMillis + ' milliseconds'
        )

        await $(input).addValue('h')
        await browser.waitUntil(async () => { return ((await regionA.getText()) === '' && (await regionB.getText()) !== ''); },
          liveRegionWaitTimeMillis,
          'expected the first aria live region to be cleared, and the second to be populated within ' +
          liveRegionWaitTimeMillis + ' milliseconds'
        )
      }
    })

    it('should set aria-selected to true on selected option and false on other options', async () => {
      await $(input).click()
      await $(input).setValue('ita')
      await browser.keys(['ArrowDown'])
      await expect(await $(firstOption).getAttribute('aria-selected')).to.equal('true')
      await expect(await $(secondOption).getAttribute('aria-selected')).to.equal('false')
      await browser.keys(['ArrowDown'])
      await expect(await $(firstOption).getAttribute('aria-selected')).to.equal('false')
      await expect(await $(secondOption).getAttribute('aria-selected')).to.equal('true')
    })

    describe('keyboard use', () => {
      it('should allow typing', async () => {
        await $(input).click()
        await $(input).addValue('ita')
        await expect(await $(input).getValue()).to.equal('ita')
      })

      it('should allow selecting an option', async () => {
        await $(input).click()
        await $(input).setValue('ita')
        await browser.keys(['ArrowDown'])
        await expect(await $(input).isFocused()).to.equal(false)
        await expect(await $(firstOption).isFocused()).to.equal(true)
        await browser.keys(['ArrowDown'])
        await expect(await $(menu).isDisplayed()).to.equal(true)
        await expect(await $(input).getValue()).to.equal('ita')
        await expect(await $(firstOption).isFocused()).to.equal(false)
        await expect(await $(secondOption).isFocused()).to.equal(true)
      })

      it('should allow confirming an option', async () => {
        await $(input).click()
        await $(input).setValue('ita')
        await browser.keys(['ArrowDown', 'Enter'])
        await browser.waitUntil(async () => (await $(input).getValue()) !== 'ita')
        await expect(await $(input).isFocused()).to.equal(true)
        await expect(await $(input).getValue()).to.equal('Italy')
      })

      it('should redirect keypresses on an option to input', async () => {
        if (!isIE) {
          await $(input).click()
          await $(input).setValue('ita')
          await browser.keys(['ArrowDown'])
          await expect(await $(input).isFocused()).to.equal(false)
          await expect(await $(firstOption).isFocused()).to.equal(true)
          await $(firstOption).addValue('l')
          await expect(await $(input).isFocused()).to.equal(true)
          await expect(await $(input).getValue()).to.equal('ital')
        } else {
          // FIXME: This feature does not work correctly on IE 9 to 11.
        }
      })
    })

    describe('mouse use', () => {
      it('should allow confirming an option', async () => {
        await $(input).click()
        await $(input).setValue('ita')
        await $(firstOption).click()
        await expect(await $(input).isFocused()).to.equal(true)
        await expect(await $(input).getValue()).to.equal('Italy')
      })
    })
  })
}

const customTemplatesExample = async () => {
  describe('custom templates example', function () {
    const input = 'input#autocomplete-customTemplates'
    const menu = `${input} + ul`
    const firstOption = `${menu} > li:first-child`
    const firstOptionInnerElement = `${firstOption} > strong`

    beforeEach(async () => {
      await $(input).setValue('') // Prevent autofilling, IE likes to do this.
    })

    describe('mouse use', () => {
      it('should allow confirming an option by clicking on child elements', async () => {
        await $(input).setValue('uni')

        if (isIE) {
          // FIXME: This feature works correctly on IE but testing it doesn't seem to work.
          return
        }

        try {
          await $(firstOptionInnerElement).click()
        } catch (error) {
          // In some cases (mainly ChromeDriver) the automation protocol won't
          // allow clicking span elements. In this case we just skip the test.
          if (error.toString().match(/Other element would receive the click/)) {
            return
          } else {
            throw error
          }
        }

        await expect(await $(input).isFocused()).to.equal(true)
        await expect(await $(input).getValue()).to.equal('United Kingdom')
      })
    })
  })
}

describe('Accessible Autocomplete', async () => {
  beforeEach(async () => {
    await browser.url('/')
  })

  it('should have the right title', async () => {
    await expect(await browser.getTitle()).to.equal('Accessible Autocomplete examples')
  })

  await basicExample()
  await customTemplatesExample()
})

describe('Accessible Autocomplete Preact', async () => {
  beforeEach(async () => {
    await browser.url('/preact')
  })

  it('should have the right title', async () => {
    await expect(await browser.getTitle()).to.equal('Accessible Autocomplete Preact examples')
  })

  await basicExample()
})

describe('Accessible Autocomplete React', async () => {
  beforeEach(async () => {
    await browser.url('/react')
  })

  it('should have the right title', async () => {
    await expect(await browser.getTitle()).to.equal('Accessible Autocomplete React examples')
  })

  await basicExample()
})
